package smtp

import "net/smtp"

type sendJob struct {
	to      string
	subject string
	addr    string
	auth    smtp.Auth
	body    []byte
}

func newSendJob(
	to,
	subject,
	addr string,
	auth smtp.Auth,
	body []byte,
) sendJob {
	return sendJob{
		to:      to,
		subject: subject,
		addr:    addr,
		auth:    auth,
		body:    body,
	}
}
