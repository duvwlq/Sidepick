export interface User {
  id: string;
  password: string;
  phone: string;
  carrier: string;
  name: string;
  birth: string;
  genderDigit: string;
  nickname: string;
}

export interface SignupFormData {
  phone: string;
  name: string;
  id: string;
  password: string;
  nickname: string;
}
