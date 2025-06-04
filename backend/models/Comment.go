package models

import "gorm.io/gorm"

type Comment struct {
	gorm.Model
	Content   string `json:"content"`
	PostID    uint   `json:"post_id"`                       // Relacionamento com a postagem
	UserID    uint   `json:"user_id"`                       // Relacionamento com o usuário (via ID)
	UserEmail string `json:"user_email"`                    // Relacionamento com o e-mail do usuário
	UserName  string `json:"user_name"`                     // Novo campo para o nome do usuário
	User      User   `gorm:"foreignKey:UserID" json:"user"` // Relacionamento com a tabela User
}
