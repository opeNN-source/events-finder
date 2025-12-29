package models

type NewUser struct {
	Email    string
	HashPass []byte
}

type User struct {
	UID      int
	Email    string
	HashPass []byte
}

type NewUserReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RefreshToken struct {
	Token string `json:"refresh_token"`
}
