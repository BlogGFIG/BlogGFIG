package models

import "time"

type Password struct {
	Email       string `json:"email" gorm:"unique"`
	Password    string `json:"password"`
	NewPassword string `json:"newPassword"`
}

type PasswordReset struct {
    Email     string
    Token     string
    ExpiresAt time.Time
}