package routes

import (
	"os"

	"github.com/BlogGFIG/BlogGFIG/controllers"
	"github.com/BlogGFIG/BlogGFIG/middlewares"
	//"github.com/go-playground/locales/mas"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

// HandleRequest configura todas as rotas do servidor
func HandleRequest() *mux.Router {
	
	// Rota acessível para usuários não autenticados
	r := mux.NewRouter()

	// Rota acessível apenas para o usuário master
	masterRoutes := r.PathPrefix("/master").Subrouter()
	masterRoutes.Use(middlewares.Authorize("master"))

	// Rota acessível apenas para o administrador
    adminRoutes := r.PathPrefix("/admin").Subrouter()
    adminRoutes.Use(middlewares.Authorize("admin", "master"))

	// Rota acessível para qualquer usuário autênticado (master, admin ou user)
	anyUserRoutes := r.PathPrefix("/anyUser").Subrouter()
	anyUserRoutes.Use(middlewares.Authorize("master", "admin", "user"))

	// Rota para o registro do usuário (TODOS) (POST)
	r.HandleFunc("/register", controllers.Register).Methods("POST")

	// Rota para o login do usuário (TODOS) (POST)
	r.HandleFunc("/login", controllers.Login).Methods("POST")

	// Rota para a atualização da senha (USUÁRIO AUTENTICADO) (PUT)
	anyUserRoutes.HandleFunc("/senhaPage", controllers.RefreshPassword).Methods("POST")

	// Rota para redefinir senha (TODOS) (POST)
	r.HandleFunc("/resetPassword", controllers.ResetPassword).Methods("POST")

	// Rota para atualizar senha (TODOS) (POST)
	r.HandleFunc("/updatePassword", controllers.UpdatePassword).Methods("POST")

	// Rota para criar uma postagem (USUÁRIO AUTENTICADO) (POST)
	anyUserRoutes.HandleFunc("/create-post", controllers.CreatePost).Methods("POST")

	// Rota para editar uma postagem (USUÁRIO AUTENTICADO) (PUT)
	anyUserRoutes.HandleFunc("/edit-post", controllers.EditPost).Methods("PUT")

	// Rota para deletar uma postagem (USUÁRIO AUTENTICADO) (DELETE)
	anyUserRoutes.HandleFunc("/delete-post", controllers.DeletePost).Methods("DELETE")

	// Rota para buscar todas as postagens (TODOS) (GET)
	r.HandleFunc("/posts", controllers.GetPosts).Methods("GET")

	// Rota para fixar uma postagem (USUÁRIO AUTENTICADO) (PUT)
	anyUserRoutes.HandleFunc("/pin-post", controllers.PinPost).Methods("PUT")

	// Rota para desfixar uma postagem (USUÁRIO AUTENTICADO) (PUT)
	anyUserRoutes.HandleFunc("/unpin-post", controllers.UnpinPost).Methods("PUT")

	// Rota para criar um comentário em uma postagem (TODOS) (POST)
	r.HandleFunc("/create-comment", controllers.CreateComment).Methods("POST")

	// Rota para editar um comentário (USUÁRIO AUTENTICADO) (PUT)
	anyUserRoutes.HandleFunc("/edit-comment", controllers.EditComment).Methods("PUT")

	// Rota para deletar um comentário (USUÁRIO AUTENTICADO) (DELETE)
	anyUserRoutes.HandleFunc("/delete-comment", controllers.DeleteComment).Methods("DELETE")

	// Rota para listar comentários de uma postagem específica (TODOS) (GET)
	r.HandleFunc("/list-comments/{postId}", controllers.ListComments).Methods("GET")

	// Rota para listar os usuários (ADMIN E MASTER) (GET)
	adminRoutes.HandleFunc("/users", controllers.GetUsers).Methods("GET")

	// Rota para alterar status do usuário entre ativo e inativo (ADMIN E MASTER) (PUT)
	adminRoutes.HandleFunc("/ativarOuInativar", controllers.AtivarOuInativar).Methods("PUT")

	// Rota para aprovar/reprovar usuário (ADMIN E MASTER) (PUT)
	adminRoutes.HandleFunc("/approveOrRejectUser", controllers.ApproveOrRejectUser).Methods("PUT")

	// Rota para atualizar a role de um usuário (MASTER) (PUT)
	masterRoutes.HandleFunc("/updateUserRole", controllers.UpdateUserRole).Methods("PUT")

	// Rota para obter o tipo de usuário pelo e-mail (TODOS) (GET)
	r.HandleFunc("/get-user-type", controllers.GetUserTypeByToken).Methods("GET")

	// Rota para arquivar uma postagem (USUÁRIO AUTENTICADO) (PUT)
	anyUserRoutes.HandleFunc("/archive-post", controllers.ArchivePost).Methods("PUT")

	// Rota para desarquivar uma postagem (USUÁRIO AUTENTICADO) (PUT)
	anyUserRoutes.HandleFunc("/unarchive-post", controllers.UnarchivePost).Methods("PUT")

	// Configuração do CORS
	corsHandler := handlers.CORS(
		// Permite a origem específica, e permite credenciais (cookies, cabeçalhos)
		handlers.AllowedOrigins([]string{
			os.Getenv("FRONTEND_ORIGIN"), // ex: https://meu-frontend.onrender.com - Render
			"http://localhost:3000",      // para testes locais
		}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
		handlers.AllowCredentials(), // Permite o envio de credenciais (cookies)
	)

	return corsHandler(r).(*mux.Router) // Retorna o roteador com CORS configurado para o main
}
