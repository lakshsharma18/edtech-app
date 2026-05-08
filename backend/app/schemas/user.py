from pydantic import BaseModel, EmailStr
 
class Register(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str

class Login(BaseModel):
    email: EmailStr
    password: str


class OTPRequest(BaseModel):
    email: EmailStr


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str