package controllers

import (
    "crypto/rand"
    "encoding/base64"
    "log"
    "net/smtp"
)

// Função para enviar o e-mail de redefinição de senha
func sendResetEmail(to, resetLink string) error {
    from := "gfigteste@gmail.com"
    password := "wszx logg cuze nfqp"

    // Configurações do servidor SMTP do Gmail
    smtpHost := "smtp.gmail.com"
    smtpPort := "587"

    // Mensagem do e-mail em HTML
    message := []byte("Subject: Redefinição de Senha\r\n" +
        "MIME-version: 1.0;\r\n" +
        "Content-Type: text/html; charset=\"UTF-8\";\r\n\r\n" +
        "<div style='font-family: Arial, sans-serif;'>" +
        "<h2>Olá!</h2>" +
        "<p>Você solicitou a redefinição de senha para sua conta no <b>GFIG</b>.</p>" +
        "<p>Digite o seguinte código ou clique no link abaixo para redefinir sua senha:</p>" +
        "<div style='font-size: 1.5em; font-weight: bold; color: #1976d2; margin: 16px 0;'>" + resetLink + "</div>" +
        "<p>Se você não solicitou, ignore este e-mail.</p>" +
        "<br><p>Atenciosamente,<br>Equipe GFIG</p>" +
        "</div>")

    // Autenticação
    auth := smtp.PlainAuth("", from, password, smtpHost)

    // Envio do e-mail
    err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, message)
    if err != nil {
        log.Println("Erro ao enviar e-mail:", err)
        return err
    }

    log.Println("E-mail enviado com sucesso para:", to)
    return nil
}

// Função para gerar um token único
func generateResetToken() (string, error) {
    b := make([]byte, 32)
    _, err := rand.Read(b)
    if err != nil {
        log.Println("Erro ao gerar token:", err)
        return "", err
    }
    return base64.URLEncoding.EncodeToString(b), nil
}