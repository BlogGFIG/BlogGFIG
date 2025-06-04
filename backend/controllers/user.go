package controllers

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/BlogGFIG/BlogGFIG/dataBase"
	"github.com/BlogGFIG/BlogGFIG/models"
	"github.com/golang-jwt/jwt/v5"

	"gorm.io/gorm"
)

func Register(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		var user models.User

		err := json.NewDecoder(r.Body).Decode(&user)
		if err != nil {
			http.Error(w, "Erro ao decodificar JSON", http.StatusBadRequest)
			return
		}

		user.UserType = "pending"

		var existingUser models.User
		result := dataBase.DB.Where("email = ?", user.Email).First(&existingUser)

		if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
			http.Error(w, "Erro ao consultar usuário", http.StatusInternalServerError)
			return
		}

		if result.Error == nil {
			http.Error(w, "Usuário já existe", http.StatusConflict)
			return
		}

		result = dataBase.DB.Create(&user)
		if result.Error != nil {
			http.Error(w, "Erro ao cadastrar usuário", http.StatusInternalServerError)
			return
		}

		fmt.Println("Usuário cadastrado com sucesso")
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Usuário cadastrado com sucesso"))
	} else {
		http.Error(w, "Método não permitido", http.StatusCreated)
	}
}

func ApproveOrRejectUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// NOVO: Pega o token do header Authorization
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Token não fornecido", http.StatusUnauthorized)
		return
	}
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenString == authHeader {
		http.Error(w, "Formato do token inválido", http.StatusUnauthorized)
		return
	}

	// NOVO: Decodifica o token JWT para pegar o e-mail do moderador
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte("bloggfig@2025"), nil
	})
	if err != nil || !token.Valid {
		http.Error(w, "Token inválido", http.StatusUnauthorized)
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		http.Error(w, "Não foi possível extrair claims do token", http.StatusUnauthorized)
		return
	}
	emailModerador, ok := claims["email"].(string)
	if !ok {
		http.Error(w, "E-mail não encontrado no token", http.StatusUnauthorized)
		return
	}

	// Estrutura para capturar os dados enviados pelo frontend
	var requestData struct {
		ID   uint   `json:"id"`
		Role string `json:"role"` // agora aceitamos "user" ou "reproved"
	}

	err = json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		http.Error(w, "Erro ao decodificar JSON", http.StatusBadRequest)
		return
	}

	// Busca o usuário no banco de dados
	var user models.User
	result := dataBase.DB.First(&user, requestData.ID)
	if result.Error == gorm.ErrRecordNotFound {
		http.Error(w, "Usuário não encontrado", http.StatusNotFound)
		return
	}
	if result.Error != nil {
		http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
		return
	}

	// Verifica se o valor enviado é válido
	if requestData.Role != "user" && requestData.Role != "reproved" {
		http.Error(w, "Ação inválida. Use 'user' ou 'reproved'.", http.StatusBadRequest)
		return
	}

	// Atualiza o campo user_type com o valor enviado
	updateResult := dataBase.DB.Model(&user).Update("user_type", requestData.Role)
	if updateResult.Error != nil {
		http.Error(w, "Erro ao atualizar tipo de usuário", http.StatusInternalServerError)
		return
	}

	// Sucesso
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf("Moderador '%s' atualizou usuário ID %d para '%s'", emailModerador, requestData.ID, requestData.Role)))
}

func Login(w http.ResponseWriter, r *http.Request) {
	fmt.Println("entrou aqui")

	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Erro ao decodificar JSON", http.StatusBadRequest)
		return
	}

	var existingUser models.User
	result := dataBase.DB.Where("email = ?", user.Email).First(&existingUser)

	if result.Error == gorm.ErrRecordNotFound {
		http.Error(w, "Usuário ou senha inválidos", http.StatusUnauthorized)
		return
	}

	if result.Error != nil {
		http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
		return
	}

	// Verifica se o status do usuário é "inativo"
	if existingUser.UserType == "pending" || existingUser.UserType == "reproved" {
		// Se o usuário estiver pendente ou reprovado, não pode fazer login
		http.Error(w, "Usuário inativo ou reprovado. Entre em contato com o suporte.", http.StatusForbidden)
		return
	}

	// Verifica se a senha/email estão corretos
	if existingUser.Password != user.Password {
		http.Error(w, "Usuário ou senha inválidos", http.StatusUnauthorized)
		return
	}

	// Gera o token JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId": existingUser.ID,
		"role":   existingUser.UserType,
		"email":  existingUser.Email,
		"name":   existingUser.Name,
		"exp":    time.Now().Add(time.Hour * 24).Unix(), // Expira em 24 horas
	})

	// Substitua "sua_chave_secreta" pela sua chave secreta
	tokenString, err := token.SignedString([]byte("bloggfig@2025"))
	if err != nil {
		http.Error(w, "Erro ao gerar token", http.StatusInternalServerError)
		return
	}

	// Login realizado com sucesso
	fmt.Println("Login realizado com sucesso!")

	// Cria a resposta com o token e o userId para ser utilizado no front-end
	response := map[string]interface{}{
		"userId": existingUser.ID,
		"token":  tokenString,
	}

	// Envia a resposta com o token e o userId
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// Ativar ou inativar um usuário
func AtivarOuInativar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// Estrutura para capturar o ID do usuário e a ação (aprovar/reprovar)
	var requestData struct {
		ID       uint `json:"id"`
		Aprovado bool `json:"aprovado"` // true para aprovado, false para reprovado
	}

	err := json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		http.Error(w, "Erro ao decodificar JSON", http.StatusBadRequest)
		return
	}

	// Busca o usuário pelo ID
	var user models.User
	result := dataBase.DB.First(&user, requestData.ID)
	if result.Error == gorm.ErrRecordNotFound {
		http.Error(w, "Usuário não encontrado", http.StatusNotFound)
		return
	}

	if result.Error != nil {
		http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
		return
	}

	// Define o novo user_type com base na aprovação ou reprovação
	newUserType := "user"
	if !requestData.Aprovado {
		newUserType = "reproved"
	}

	// Atualiza o user_type do usuário
	updateResult := dataBase.DB.Model(&user).Update("user_type", newUserType)
	if updateResult.Error != nil {
		http.Error(w, "Erro ao atualizar tipo de usuário", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf("Usuário ID %d atualizado para tipo '%s'", requestData.ID, newUserType)))
}

// Atualiza a role de um usuário (apenas para usuários com role "master")
func UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	// Verifica se o método HTTP é PUT
	if r.Method != http.MethodPut {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// Obtém o token do cabeçalho Authorization
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Token não fornecido", http.StatusUnauthorized)
		return
	}

	// Remove o prefixo "Bearer " do token
	tokenString := authHeader[len("Bearer "):]

	// Decodifica o token JWT
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Valida o método de assinatura
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de assinatura inválido")
		}
		// Retorna a chave secreta usada para assinar o token
		return []byte("bloggfig@2025"), nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Token inválido", http.StatusUnauthorized)
		return
	}

	// Extrai as claims do token
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		http.Error(w, "Erro ao extrair claims do token", http.StatusInternalServerError)
		return
	}

	// Obtém o tipo de usuário e o ID do solicitante das claims
	requesterRole, ok := claims["role"].(string)
	if !ok {
		http.Error(w, "Role do usuário não encontrada no token", http.StatusInternalServerError)
		return
	}

	requesterID, ok := claims["userId"].(float64) // JWT armazena números como float64
	if !ok {
		http.Error(w, "ID do usuário não encontrado no token", http.StatusInternalServerError)
		return
	}

	// Estrutura para capturar o ID do usuário a ser atualizado e a nova role
	var requestData struct {
		ID   uint   `json:"id"`   // ID do usuário a ser atualizado
		Role string `json:"role"` // Valores esperados: "admin", "user" ou "master"
	}

	// Decodifica o corpo da requisição
	err = json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		http.Error(w, "Erro ao decodificar JSON", http.StatusBadRequest)
		return
	}

	// Valida a role fornecida
	if requestData.Role != "admin" && requestData.Role != "user" && requestData.Role != "master" {
		http.Error(w, "Role inválida. Use 'admin', 'user' ou 'master'.", http.StatusBadRequest)
		return
	}

	// Verifica se o solicitante tem permissão para atualizar roles
	if requesterRole != "master" {
		http.Error(w, "Permissão negada. Apenas usuários com a role 'master' podem atualizar roles.", http.StatusForbidden)
		return
	}

	// Busca o usuário a ser atualizado
	var user models.User
	result := dataBase.DB.First(&user, requestData.ID)
	if result.Error == gorm.ErrRecordNotFound {
		http.Error(w, "Usuário não encontrado", http.StatusNotFound)
		return
	}

	// Verifica erros ao buscar o usuário a ser atualizado
	if result.Error != nil {
		http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
		return
	}

	// Verifica se o userType do usuário é "reproved"
	if user.UserType == "reproved" {
		http.Error(w, "Usuário reprovado. Não é possível atualizar a role.", http.StatusForbidden)
		return
	}

	// Permite que o "master" altere sua própria role e a de outros usuários
	// Verifica se o usuário solicitante está tentando atualizar a própria role, mas permite para usuários 'master'
	if uint(requesterID) == user.ID && requesterRole != "master" {
		http.Error(w, "Usuário não pode alterar a própria role.", http.StatusForbidden)
		return
	}

	// Atualiza a role do usuário
	updateResult := dataBase.DB.Model(&user).Update("user_type", requestData.Role)
	if updateResult.Error != nil {
		http.Error(w, "Erro ao atualizar role do usuário", http.StatusInternalServerError)
		return
	}

	// Retorna sucesso
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf("Role do usuário atualizada para '%s'", requestData.Role)))
}

// Atualiza a senha quando o usuário já sabe a própria senha
func RefreshPassword(w http.ResponseWriter, r *http.Request) {
	// Obtém o token do cabeçalho Authorization
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Token não fornecido", http.StatusUnauthorized)
		return
	}

	// Remove o prefixo "Bearer " do token
	tokenString := authHeader[len("Bearer "):]

	// Decodifica o token JWT
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Valida o método de assinatura
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de assinatura inválido")
		}
		// Retorna a chave secreta usada para assinar o token
		return []byte("bloggfig@2025"), nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Token inválido", http.StatusUnauthorized)
		return
	}

	// Extrai as claims do token
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		http.Error(w, "Erro ao extrair claims do token", http.StatusInternalServerError)
		return
	}

	// Obtém o ID do usuário do token
	userIdFromToken, ok := claims["userId"].(float64) // JWT armazena números como float64
	if !ok {
		http.Error(w, "ID do usuário não encontrado no token", http.StatusInternalServerError)
		return
	}

	var passwordUpdate models.Password
	err = json.NewDecoder(r.Body).Decode(&passwordUpdate)
	if err != nil {
		http.Error(w, "Erro ao decodificar JSON", http.StatusBadRequest)
		return
	}

	var existingUser models.User
	result := dataBase.DB.Where("email = ?", passwordUpdate.Email).First(&existingUser)
	if result.Error == gorm.ErrRecordNotFound {
		http.Error(w, "Usuário não encontrado", http.StatusNotFound)
		return
	}

	// Verifica se o ID do usuário no token corresponde ao ID do usuário no banco de dados
	if uint(userIdFromToken) != existingUser.ID {
		http.Error(w, "Usuário não autorizado a alterar esta senha", http.StatusForbidden)
		return
	}

	if existingUser.Password != passwordUpdate.Password {
		http.Error(w, "Senha atual incorreta", http.StatusUnauthorized)
		return
	}

	updateResult := dataBase.DB.Model(&existingUser).Where("email = ?", passwordUpdate.Email).
		Update("password", passwordUpdate.NewPassword)

	if updateResult.Error != nil {
		http.Error(w, "Erro ao atualizar a senha", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Senha atualizada com sucesso"))
}

// Gere um código numérico de 6 dígitos
func generateResetCode() string {
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

// Atualiza a senha quando o usuário esqueceu a senha atual - Envio do código por e-mail
func ResetPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var passwordReset struct {
		Email string `json:"email"`
	}

	err := json.NewDecoder(r.Body).Decode(&passwordReset)
	if err != nil || passwordReset.Email == "" {
		http.Error(w, "Email não fornecido", http.StatusBadRequest)
		return
	}

	var existingUser models.User
	result := dataBase.DB.Where("email = ?", passwordReset.Email).First(&existingUser)
	if result.Error == gorm.ErrRecordNotFound {
		http.Error(w, "Usuário não encontrado", http.StatusNotFound)
		return
	}
	if result.Error != nil {
		http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
		return
	}

	// Gere um código de 6 dígitos
	code := generateResetCode()
	expiresAt := time.Now().UTC().Add(30 * time.Minute)

	// Salve o código na tabela password_resets
	resetEntry := models.PasswordReset{
		Email:     passwordReset.Email,
		Token:     code, // Aqui usamos o campo Token para armazenar o código
		ExpiresAt: expiresAt,
	}
	dataBase.DB.Where("email = ?", passwordReset.Email).Delete(&models.PasswordReset{}) // Remove códigos antigos
	result = dataBase.DB.Create(&resetEntry)
	if result.Error != nil {
		http.Error(w, "Erro ao armazenar código de redefinição", http.StatusInternalServerError)
		return
	}

	// Envie o código por e-mail
	err = sendResetEmail(passwordReset.Email, code)
	if err != nil {
		http.Error(w, "Erro ao enviar e-mail", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Código de redefinição enviado com sucesso"))
}

// Atualiza a senha usando o código
func UpdatePassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var passwordUpdate struct {
		Email       string `json:"email"`
		Code        string `json:"code"`
		NewPassword string `json:"newPassword"`
	}

	err := json.NewDecoder(r.Body).Decode(&passwordUpdate)
	if err != nil || passwordUpdate.Email == "" || passwordUpdate.Code == "" || passwordUpdate.NewPassword == "" {
		http.Error(w, "Dados incompletos", http.StatusBadRequest)
		return
	}

	// Verifique o código na tabela password_resets
	var resetEntry models.PasswordReset
	code := strings.TrimSpace(passwordUpdate.Code)
	result := dataBase.DB.Where("email = ? AND token = ?", passwordUpdate.Email, code).First(&resetEntry)
	if result.Error == gorm.ErrRecordNotFound {
		http.Error(w, "Código inválido ou expirado", http.StatusUnauthorized)
		return
	}

	now := time.Now().UTC()
	expiresAt := resetEntry.ExpiresAt.UTC()

	fmt.Println("Código recebido:", code)
	fmt.Println("Código no banco:", resetEntry.Token)
	fmt.Println("Expira em:", expiresAt)
	fmt.Println("Agora:", now)
	fmt.Println("Expirou?", now.After(expiresAt))

	if now.After(expiresAt) {
		http.Error(w, "Código inválido ou expirado", http.StatusUnauthorized)
		return
	}

	var existingUser models.User
	result = dataBase.DB.Where("email = ?", passwordUpdate.Email).First(&existingUser)
	if result.Error == gorm.ErrRecordNotFound {
		// Remove o código mesmo se o usuário não for encontrado
		dataBase.DB.Delete(&resetEntry)
		http.Error(w, "Usuário não encontrado", http.StatusNotFound)
		return
	}

	// Atualize a senha
	updateResult := dataBase.DB.Model(&existingUser).Update("password", passwordUpdate.NewPassword)
	// Remova o código após o uso (sempre, independente de erro)
	dataBase.DB.Where("email = ? AND token = ?", resetEntry.Email, resetEntry.Token).Delete(&models.PasswordReset{})
	if updateResult.Error != nil {
		http.Error(w, "Erro ao atualizar a senha", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Senha atualizada com sucesso"))
}

func GetUserTypeByToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// Obtém o token do cabeçalho Authorization
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Token não fornecido", http.StatusUnauthorized)
		return
	}

	// Remove o prefixo "Bearer " do token
	tokenString := authHeader[len("Bearer "):]

	// Decodifica o token JWT
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Valida o método de assinatura
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de assinatura inválido")
		}
		// Retorna a chave secreta usada para assinar o token
		return []byte("bloggfig@2025"), nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Token inválido", http.StatusUnauthorized)
		return
	}

	// Extrai as claims do token
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		http.Error(w, "Erro ao extrair claims do token", http.StatusInternalServerError)
		return
	}

	// Obtém o tipo de usuário das claims
	userType, ok := claims["role"].(string)
	if !ok {
		http.Error(w, "Tipo de usuário não encontrado no token", http.StatusInternalServerError)
		return
	}

	// Retorna o tipo de usuário
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf("Tipo de usuário: %s", userType)))
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// Obtém o token do cabeçalho Authorization
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Token não fornecido", http.StatusUnauthorized)
		return
	}
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenString == authHeader {
		http.Error(w, "Formato do token inválido", http.StatusUnauthorized)
		return
	}

	// Decodifica o token JWT
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte("bloggfig@2025"), nil
	})
	if err != nil || !token.Valid {
		http.Error(w, "Token inválido", http.StatusUnauthorized)
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		http.Error(w, "Erro ao extrair claims do token", http.StatusInternalServerError)
		return
	}

	// Obtém o ID do usuário do token
	userIdFromToken, ok := claims["userId"].(float64)
	if !ok {
		http.Error(w, "ID do usuário não encontrado no token", http.StatusInternalServerError)
		return
	}

	// Recebe a senha do corpo da requisição
	var reqData struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&reqData); err != nil || reqData.Password == "" {
		http.Error(w, "Senha não fornecida", http.StatusBadRequest)
		return
	}

	// Busca o usuário no banco de dados
	var user models.User
	result := dataBase.DB.First(&user, uint(userIdFromToken))
	if result.Error == gorm.ErrRecordNotFound {
		http.Error(w, "Usuário não encontrado", http.StatusNotFound)
		return
	}
	if result.Error != nil {
		http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
		return
	}

	// Verifica se a senha está correta
	if user.Password != reqData.Password {
		http.Error(w, "Senha incorreta", http.StatusUnauthorized)
		return
	}

	// Deleta o usuário
	deleteResult := dataBase.DB.Delete(&user)
	if deleteResult.Error != nil {
		http.Error(w, "Erro ao deletar usuário", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Usuário deletado com sucesso"))
}
