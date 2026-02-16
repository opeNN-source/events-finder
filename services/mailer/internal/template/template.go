package templates

import (
	"bytes"
	"html/template"
	"log/slog"
	"time"
)

var htmlFuncMap = template.FuncMap{
	"formatDateTime": func(t time.Time) string {
		return t.Format("02.01.2006 15:04")
	},
}

var icsFuncMap = template.FuncMap{}

var (
	TplHtmlName = "html_template"
	TplIcsName  = "ics_template"

	RegHtmlFilename = "event_registration.html"
	RegIcsFilename  = "event_registration.ics"
)

type Renderer struct {
	tpls   map[string]*template.Template
	logger *slog.Logger
}

func NewRenderer(logger *slog.Logger) *Renderer {
	return &Renderer{
		tpls:   make(map[string]*template.Template),
		logger: logger,
	}
}

func (r *Renderer) LoadHtml(dir string) (err error) {
	r.tpls[TplHtmlName], err = template.New("emailHtml").Funcs(htmlFuncMap).ParseGlob(dir + "/*.html")

	return
}

func (r *Renderer) LoadIcs(dir string) (err error) {
	r.tpls[TplIcsName], err = template.New("emailIcs").Funcs(icsFuncMap).ParseGlob(dir + "/*.ics")

	return
}

func (r *Renderer) Render(name, tplName string, data any) (string, error) {
	var buf bytes.Buffer

	err := r.tpls[tplName].ExecuteTemplate(&buf, name, data)
	if err != nil {
		r.logger.Error("TEMPLATE: render failed",
			"name", name,
			"error", err.Error(),
		)
		return "", err
	}

	return buf.String(), nil
}
