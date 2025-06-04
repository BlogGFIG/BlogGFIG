package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/BlogGFIG/BlogGFIG/dataBase"
	"github.com/BlogGFIG/BlogGFIG/models"
	"github.com/BlogGFIG/BlogGFIG/utils"
	"github.com/golang-jwt/jwt/v5"

	"gorm.io/gorm"
)

// Função para validar o token JWT e retornar as claims
func validateToken(tokenString string) (jwt.MapClaims, error) {
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
		return nil, fmt.Errorf("token inválido ou expirado")
	}

	// Extrai as claims do token
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("erro ao extrair claims do token")
	}

	return claims, nil
}

// CreatePost: Função para criar uma nova postagem
func CreatePost(w http.ResponseWriter, r *http.Request) {
	// Validação do token
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Token não fornecido", http.StatusUnauthorized)
		return
	}

	// Remove o prefixo "Bearer " do token
	tokenString := authHeader[len("Bearer "):]

	// Valida o token e obtém as claims
	claims, err := validateToken(tokenString)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Obtém o e-mail e o tipo de usuário das claims
	email, ok := claims["email"].(string)
	if !ok {
		http.Error(w, "E-mail não encontrado no token", http.StatusInternalServerError)
		return
	}

	userType, ok := claims["role"].(string)
	if !ok {
		http.Error(w, "Tipo de usuário não encontrado no token", http.StatusInternalServerError)
		return
	}

	// Validando se o usuário pode criar uma postagem
	if userType != "admin" && userType != "master" {
		http.Error(w, "Usuário não autorizado a criar postagens", http.StatusForbidden)
		return
	}

	// Defina o limite para o tamanho do arquivo
	err = r.ParseMultipartForm(10 << 20) // 10 MB
	if err != nil {
		http.Error(w, "Erro ao processar o formulário", http.StatusBadRequest)
		return
	}

	// Pegando os dados do formulário
	title := r.FormValue("title")
	content := r.FormValue("content")

	// Filtro de badwords
	if utils.ContainsBadword(title) || utils.ContainsBadword(content) {
		http.Error(w, "O título ou conteúdo contém palavras proibidas", http.StatusBadRequest)
		return
	}

	imageFile, _, err := r.FormFile("image")
	var imageBytes []byte
	if err == nil {
		imageBytes, err = io.ReadAll(imageFile)
		if err != nil {
			http.Error(w, "Erro ao ler a imagem", http.StatusInternalServerError)
			return
		}
		defer imageFile.Close()
	}

	// Buscando o user_id com base no e-mail
	var user models.User
	result := dataBase.DB.Where("email = ?", email).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Usuário não encontrado", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
		return
	}

	post := models.Post{
		Title:     title,
		Content:   content,
		Image:     imageBytes,
		UserID:    user.ID,
		UserEmail: email,
		Pinned:    false,
	}

	result = dataBase.DB.Create(&post)
	if result.Error != nil {
		http.Error(w, "Erro ao salvar a postagem", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Postagem criada com sucesso!"))
}

func GetPosts(w http.ResponseWriter, r *http.Request) {
	type PostWithUser struct {
		models.Post
		UserName string `json:"user_name"`
	}

	var postsWithUsers []PostWithUser

	result := dataBase.DB.Table("posts").
		Select("posts.*, users.name as user_name").
		Joins("inner join users on users.id = posts.user_id").
		Order("posts.pinned DESC").
		Order("posts.created_at DESC").
		Scan(&postsWithUsers)

	if result.Error != nil {
		http.Error(w, "Erro ao buscar postagens", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(postsWithUsers)
}

// EditPost: Função para editar uma postagem existente
func EditPost(w http.ResponseWriter, r *http.Request) {
	// Validação do token
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Token não fornecido", http.StatusUnauthorized)
		return
	}

	tokenString := authHeader[len("Bearer "):]
	claims, err := validateToken(tokenString)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	email, ok := claims["email"].(string)
	if !ok {
		http.Error(w, "E-mail não encontrado no token", http.StatusInternalServerError)
		return
	}

	userType, ok := claims["role"].(string)
	if !ok {
		http.Error(w, "Tipo de usuário não encontrado no token", http.StatusInternalServerError)
		return
	}

	err = r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Erro ao processar o formulário", http.StatusBadRequest)
		return
	}

	postID := r.FormValue("post_id")
	title := r.FormValue("title")
	content := r.FormValue("content")

	// Filtro de badwords
	if (title != "" && utils.ContainsBadword(title)) || (content != "" && utils.ContainsBadword(content)) {
		http.Error(w, "O título ou conteúdo contém palavras proibidas", http.StatusBadRequest)
		return
	}

	imageFile, _, err := r.FormFile("image")

	var post models.Post
	result := dataBase.DB.First(&post, postID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Postagem não encontrada", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar postagem", http.StatusInternalServerError)
		return
	}

	if userType == "user" {
		if post.UserEmail != email {
			http.Error(w, "Usuário não autorizado a editar esta postagem", http.StatusForbidden)
			return
		}
	} else if userType != "admin" && userType != "master" {
		http.Error(w, "Usuário não autorizado a editar esta postagem", http.StatusForbidden)
		return
	}

	if title != "" {
		post.Title = title
	}
	if content != "" {
		post.Content = content
	}
	if err == nil {
		imageBytes, err := io.ReadAll(imageFile)
		if err != nil {
			http.Error(w, "Erro ao ler a imagem", http.StatusInternalServerError)
			return
		}
		post.Image = imageBytes
		defer imageFile.Close()
	}

	result = dataBase.DB.Save(&post)
	if result.Error != nil {
		http.Error(w, "Erro ao salvar alterações na postagem", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Postagem editada com sucesso!"))
}

// DeletePost: Função para deletar uma postagem existente e seus comentários
func DeletePost(w http.ResponseWriter, r *http.Request) {
	// Pegando o ID da postagem a ser deletada do formulário
	postID := r.FormValue("post_id")
	email := r.FormValue("email") // O e-mail do usuário vem do front-end

	// Buscando o usuário com base no e-mail
	var user models.User
	result := dataBase.DB.Where("email = ?", email).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Usuário não encontrado", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
		return
	}

	// Buscando a postagem com base no ID
	var post models.Post
	result = dataBase.DB.First(&post, postID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Postagem não encontrada", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar postagem", http.StatusInternalServerError)
		return
	}

	// Validando se o usuário pode deletar a postagem
	if post.UserID != user.ID && user.UserType != "admin" && user.UserType != "master" {
		http.Error(w, "Usuário não autorizado a deletar esta postagem", http.StatusForbidden)
		return
	}

	// Excluindo os comentários associados à postagem
	result = dataBase.DB.Where("post_id = ?", postID).Delete(&models.Comment{})
	if result.Error != nil {
		http.Error(w, "Erro ao deletar comentários da postagem", http.StatusInternalServerError)
		return
	}

	// Excluindo a postagem
	result = dataBase.DB.Delete(&post)
	if result.Error != nil {
		http.Error(w, "Erro ao deletar a postagem", http.StatusInternalServerError)
		return
	}

	// Enviar resposta de sucesso
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Postagem e seus comentários foram deletados com sucesso!"))
}

func PinPost(w http.ResponseWriter, r *http.Request) {
	// Recebe os dados do corpo da requisição
	var request struct {
		PostID uint   `json:"postId"`
		Email  string `json:"email"`
	}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Erro ao ler os dados da requisição", http.StatusBadRequest)
		return
	}

	// Buscando o usuário pelo e-mail
	var user models.User
	result := dataBase.DB.Where("email = ?", request.Email).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Usuário não encontrado", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
		return
	}

	// Verificando se o usuário é admin ou master
	if user.UserType != "admin" && user.UserType != "master" {
		http.Error(w, "Apenas administradores ou mestres podem fixar postagens", http.StatusForbidden)
		return
	}

	// Desfixar qualquer postagem já fixada
	result = dataBase.DB.Model(&models.Post{}).Where("pinned = ?", true).Update("pinned", false)
	if result.Error != nil {
		http.Error(w, "Erro ao desfixar postagens anteriores", http.StatusInternalServerError)
		return
	}

	// Buscar a postagem a ser fixada
	var post models.Post
	result = dataBase.DB.First(&post, request.PostID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Postagem não encontrada", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar postagem", http.StatusInternalServerError)
		return
	}

	// Fixar a postagem
	post.Pinned = true
	result = dataBase.DB.Save(&post)
	if result.Error != nil {
		http.Error(w, "Erro ao fixar a postagem", http.StatusInternalServerError)
		return
	}

	// Resposta de sucesso
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Postagem fixada com sucesso!"))
}

func UnpinPost(w http.ResponseWriter, r *http.Request) {
	// Recebe os dados do corpo da requisição
	var request struct {
		PostID uint   `json:"postId"`
		Email  string `json:"email"`
	}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Erro ao ler os dados da requisição", http.StatusBadRequest)
		return
	}

	// Buscando o usuário pelo e-mail
	var user models.User
	result := dataBase.DB.Where("email = ?", request.Email).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Usuário não encontrado", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
		return
	}

	// Verificando se o usuário é admin ou master
	if user.UserType != "admin" && user.UserType != "master" {
		http.Error(w, "Apenas administradores ou mestres podem desfixar postagens", http.StatusForbidden)
		return
	}

	// Buscar a postagem a ser desfixada
	var post models.Post
	result = dataBase.DB.First(&post, request.PostID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Postagem não encontrada", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar postagem", http.StatusInternalServerError)
		return
	}

	// Verificando se a postagem já está desfixada
	if !post.Pinned {
		http.Error(w, "A postagem já está desfixada", http.StatusBadRequest)
		return
	}

	// Desfixar a postagem
	post.Pinned = false
	result = dataBase.DB.Save(&post)
	if result.Error != nil {
		http.Error(w, "Erro ao desfixar a postagem", http.StatusInternalServerError)
		return
	}

	// Resposta de sucesso
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Postagem desfixada com sucesso!"))
}

// ArchivePost: Função para arquivar uma postagem
func ArchivePost(w http.ResponseWriter, r *http.Request) {
	// Validação do token
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Token não fornecido", http.StatusUnauthorized)
		return
	}

	// Remove o prefixo "Bearer " do token
	tokenString := authHeader[len("Bearer "):]

	// Valida o token e obtém as claims
	claims, err := validateToken(tokenString)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Obtém o e-mail e o tipo de usuário das claims
	email, ok := claims["email"].(string)
	if !ok {
		http.Error(w, "E-mail não encontrado no token", http.StatusInternalServerError)
		return
	}

	userType, ok := claims["role"].(string)
	if !ok {
		http.Error(w, "Tipo de usuário não encontrado no token", http.StatusInternalServerError)
		return
	}

	// Recebe os dados do corpo da requisição
	var request struct {
		PostID uint `json:"postId"`
	}
	err = json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Erro ao ler os dados da requisição", http.StatusBadRequest)
		return
	}

	// Buscando o usuário pelo e-mail
	var user models.User
	result := dataBase.DB.Where("email = ?", email).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Usuário não encontrado", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
		return
	}

	// Buscando a postagem com base no ID
	var post models.Post
	result = dataBase.DB.First(&post, request.PostID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Postagem não encontrada", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar postagem", http.StatusInternalServerError)
		return
	}

	// Validando se o usuário pode arquivar a postagem
	if post.UserID != user.ID && userType != "admin" && userType != "master" {
		http.Error(w, "Usuário não autorizado a arquivar esta postagem", http.StatusForbidden)
		return
	}

	// Arquivando a postagem
	post.Archived = true
	result = dataBase.DB.Save(&post)
	if result.Error != nil {
		http.Error(w, "Erro ao arquivar a postagem", http.StatusInternalServerError)
		return
	}

	// Resposta de sucesso
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Postagem arquivada com sucesso!"))
}

// UnarchivePost: Função para desarquivar uma postagem
func UnarchivePost(w http.ResponseWriter, r *http.Request) {
	// Validação do token
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Token não fornecido", http.StatusUnauthorized)
		return
	}

	// Remove o prefixo "Bearer " do token
	tokenString := authHeader[len("Bearer "):]

	// Valida o token e obtém as claims
	claims, err := validateToken(tokenString)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Obtém o e-mail e o tipo de usuário das claims
	email, ok := claims["email"].(string)
	if !ok {
		http.Error(w, "E-mail não encontrado no token", http.StatusInternalServerError)
		return
	}

	userType, ok := claims["role"].(string)
	if !ok {
		http.Error(w, "Tipo de usuário não encontrado no token", http.StatusInternalServerError)
		return
	}

	// Recebe os dados do corpo da requisição
	var request struct {
		PostID uint `json:"postId"`
	}
	err = json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Erro ao ler os dados da requisição", http.StatusBadRequest)
		return
	}

	// Buscando o usuário pelo e-mail
	var user models.User
	result := dataBase.DB.Where("email = ?", email).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Usuário não encontrado", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
		return
	}

	// Buscando a postagem com base no ID
	var post models.Post
	result = dataBase.DB.First(&post, request.PostID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Postagem não encontrada", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar postagem", http.StatusInternalServerError)
		return
	}

	// Validando se o usuário pode desarquivar a postagem
	if post.UserID != user.ID && userType != "admin" && userType != "master" {
		http.Error(w, "Usuário não autorizado a desarquivar esta postagem", http.StatusForbidden)
		return
	}

	// Verificando se a postagem já está desarquivada
	if !post.Archived {
		http.Error(w, "A postagem já está desarquivada", http.StatusBadRequest)
		return
	}

	// Desarquivando a postagem
	post.Archived = false
	result = dataBase.DB.Save(&post)
	if result.Error != nil {
		http.Error(w, "Erro ao desarquivar a postagem", http.StatusInternalServerError)
		return
	}

	// Resposta de sucesso
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Postagem desarquivada com sucesso!"))
}
