package domain

type Mailer interface {
	SendRegEvent(to string, eventData []Event) error
}

type Renderer interface {
	Render(name string, data any) (string, error)
}
