package middlewares

import (
    "net/http"
    "strings"

    "github.com/golang-jwt/jwt/v5"
)

// Authorize verifica se o usuário tem permissão para acessar a rota
func Authorize(allowedRoles ...string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Obtenha o token do cabeçalho Authorization
            authHeader := r.Header.Get("Authorization")
            if authHeader == "" {
                http.Error(w, "Token não fornecido", http.StatusUnauthorized)
                return
            }

            tokenString := strings.TrimPrefix(authHeader, "Bearer ")
            token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
                // Substitua pela sua chave secreta
                return []byte("bloggfig@2025"), nil
            })

            if err != nil || !token.Valid {
                http.Error(w, "Token inválido", http.StatusUnauthorized)
                return
            }

            // Extraia as claims do token
            claims, ok := token.Claims.(jwt.MapClaims)
            if !ok {
                http.Error(w, "Erro ao processar token", http.StatusUnauthorized)
                return
            }

            // Verifique o tipo de usuário
            userRole, ok := claims["role"].(string)
            if !ok {
                http.Error(w, "Tipo de usuário não encontrado", http.StatusForbidden)
                return
            }

            // Verifique se o tipo de usuário está permitido
            for _, role := range allowedRoles {
                if userRole == role {
                    next.ServeHTTP(w, r)
                    return
                }
            }

            http.Error(w, "Acesso negado", http.StatusForbidden)
        })
    }
}