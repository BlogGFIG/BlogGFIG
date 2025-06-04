package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/BlogGFIG/BlogGFIG/dataBase"
	"github.com/BlogGFIG/BlogGFIG/models"
	"github.com/BlogGFIG/BlogGFIG/utils"
	jwt "github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

func CreateComment(w http.ResponseWriter, r *http.Request) {
	// Recebe os dados do corpo da requisição
	var commentRequest struct {
		Content   string `json:"content"`
		PostID    uint   `json:"postId"`
		UserName  string `json:"userName"`
		UserEmail string `json:"userEmail"`
	}
	err := json.NewDecoder(r.Body).Decode(&commentRequest)
	if err != nil {
		http.Error(w, "Erro ao ler os dados da requisição", http.StatusBadRequest)
		return
	}

	// Filtro de badwords
	if utils.ContainsBadword(commentRequest.Content) {
		http.Error(w, "O comentário contém palavras proibidas", http.StatusBadRequest)
		return
	}

	// Extrai o nome do usuário do token JWT
	userName := "Anônimo"
	userEmail := ""
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, _ := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte("bloggfig@2025"), nil // Use sua chave secreta
		})
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			if name, ok := claims["name"].(string); ok && name != "" {
				userName = name
			}
			if email, ok := claims["email"].(string); ok && email != "" {
				userEmail = email
			}
		}
	}
	if commentRequest.UserName == "" {
		commentRequest.UserName = userName
	}
	if commentRequest.UserEmail == "" {
		commentRequest.UserEmail = userEmail
		if commentRequest.UserEmail == "" {
			commentRequest.UserEmail = "Anônimo"
		}
	}

	// Criação do comentário
	comment := models.Comment{
		Content:   commentRequest.Content,
		PostID:    commentRequest.PostID,
		UserName:  commentRequest.UserName,
		UserEmail: commentRequest.UserEmail,
	}

	// Inserindo no banco
	result := dataBase.DB.Create(&comment)
	if result.Error != nil {
		http.Error(w, "Erro ao salvar comentário", http.StatusInternalServerError)
		return
	}

	// Log de sucesso
	fmt.Println("Comentário criado com sucesso para o post ID:", comment.PostID)

	// Resposta de sucesso
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Comentário criado com sucesso!"))
}

// ListComments é responsável por listar os comentários de uma postagem específica.
func ListComments(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Recebendo requisição para listar os comentários")

	postID := mux.Vars(r)["postId"]
	fmt.Printf("Post ID: %s\n", postID)

	var comments []models.Comment
	result := dataBase.DB.Preload("User").Where("post_id = ?", postID).Find(&comments)
	if result.Error != nil {
		http.Error(w, "Erro ao buscar comentários", http.StatusInternalServerError)
		fmt.Println("Erro ao buscar comentários:", result.Error)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	type CommentResponse struct {
		ID        uint   `json:"id"`
		Content   string `json:"content"`
		UserEmail string `json:"user_email"`
		UserName  string `json:"user_name"`
		Date      string `json:"date"`
	}

	var response []CommentResponse
	for _, comment := range comments {
		UserName := comment.UserName
		if UserName == "" {
			UserName = "Anônimo"
		}

		response = append(response, CommentResponse{
			ID:        comment.ID,
			Content:   comment.Content,
			UserEmail: comment.UserEmail,
			UserName:  UserName,
			Date:      comment.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Erro ao enviar comentários", http.StatusInternalServerError)
		fmt.Println("Erro ao enviar comentários:", err)
		return
	}

	fmt.Println("Comentários enviados com sucesso para o front-end")
}

func EditComment(w http.ResponseWriter, r *http.Request) {
	// Recebe os dados do corpo da requisição
	var commentRequest struct {
		CommentID uint   `json:"commentId"`
		Content   string `json:"content"`
		UserEmail string `json:"userEmail"`
	}
	err := json.NewDecoder(r.Body).Decode(&commentRequest)
	if err != nil {
		http.Error(w, "Erro ao ler os dados da requisição", http.StatusBadRequest)
		return
	}

	// Filtro de badwords
	if utils.ContainsBadword(commentRequest.Content) {
		http.Error(w, "O comentário contém palavras proibidas", http.StatusBadRequest)
		return
	}

	// Buscando o comentário pelo ID
	var comment models.Comment
	result := dataBase.DB.First(&comment, commentRequest.CommentID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Comentário não encontrado", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar comentário", http.StatusInternalServerError)
		return
	}

	// Verificando se o comentário foi criado por um usuário anônimo
	if comment.UserEmail == "Anônimo" {
		http.Error(w, "Comentários anônimos não podem ser editados", http.StatusForbidden)
		return
	}

	// Verificando se o e-mail do usuário corresponde ao criador do comentário
	if comment.UserEmail != commentRequest.UserEmail {
		http.Error(w, "Usuário não autorizado a editar este comentário", http.StatusForbidden)
		return
	}

	// Atualizando o conteúdo do comentário
	comment.Content = commentRequest.Content

	// Salvando as alterações no banco de dados
	result = dataBase.DB.Save(&comment)
	if result.Error != nil {
		http.Error(w, "Erro ao salvar alterações no comentário", http.StatusInternalServerError)
		return
	}

	// Resposta de sucesso
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Comentário editado com sucesso!"))
}

func DeleteComment(w http.ResponseWriter, r *http.Request) {
	// Recebe os dados do corpo da requisição
	var deleteRequest struct {
		CommentID uint   `json:"commentId"`
		UserEmail string `json:"userEmail"`
	}
	err := json.NewDecoder(r.Body).Decode(&deleteRequest)
	if err != nil {
		http.Error(w, "Erro ao ler os dados da requisição", http.StatusBadRequest)
		return
	}

	// Buscando o comentário pelo ID
	var comment models.Comment
	result := dataBase.DB.First(&comment, deleteRequest.CommentID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Comentário não encontrado", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar comentário", http.StatusInternalServerError)
		return
	}

	// Buscando o usuário pelo e-mail
	var user models.User
	result = dataBase.DB.Where("email = ?", deleteRequest.UserEmail).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Usuário não encontrado", http.StatusNotFound)
			return
		}
		http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
		return
	}

	// Verificando se o comentário é anônimo
	if comment.UserEmail == "Anônimo" {
		// Apenas administradores podem excluir comentários anônimos
		if user.UserType != "admin" {
			http.Error(w, "Apenas administradores podem excluir comentários anônimos", http.StatusForbidden)
			return
		}
	} else {
		// Verificando se o usuário é o autor do comentário ou um admin
		if comment.UserEmail != deleteRequest.UserEmail && user.UserType != "admin" {
			http.Error(w, "Usuário não autorizado a deletar este comentário", http.StatusForbidden)
			return
		}
	}

	// Excluindo o comentário
	result = dataBase.DB.Delete(&comment)
	if result.Error != nil {
		http.Error(w, "Erro ao deletar o comentário", http.StatusInternalServerError)
		return
	}

	// Resposta de sucesso
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Comentário deletado com sucesso!"))
}
