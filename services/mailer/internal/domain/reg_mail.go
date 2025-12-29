package domain

type RegInput struct {
	To     string
	Events []Event
}

func NewRegInput(to string, events []Event) RegInput {
	return RegInput{
		To:     to,
		Events: events,
	}
}

type RegPreRender struct {
	To    string
	Event Event
}

func NewRegPreRender(to string, event Event) RegPreRender {
	return RegPreRender{
		To:    to,
		Event: event,
	}
}

type RegTempData struct {
	Event
}

func NewRegTempData(format, region, category, eType string) RegTempData {
	return RegTempData{
		Event{
			Format:   format,
			Region:   region,
			Category: category,
			Type:     eType,
		},
	}
}
