from pydantic import BaseModel, EmailStr

class TenantRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class TenantLogin(BaseModel):
    email: EmailStr
    password: str

class TenantResponse(BaseModel):
    id: str
    name: str
    email: str
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshRequest(BaseModel):
    refresh_token: str