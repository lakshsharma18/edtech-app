from pydantic import BaseModel, EmailStr
 
class Register(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str