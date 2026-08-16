export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
export const PHONE_PATTERN = /^\+?[0-9\s().-]{10,20}$/;
export const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
export const POSTAL_CODE_PATTERN = /^\d{5}$/;
export const NAME_PATTERN = /^[\p{L}\s.'-]{2,100}$/u;

export function getAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const birthdayHasPassed = today.getMonth() > birth.getMonth()
    || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!birthdayHasPassed) age -= 1;
  return age;
}

export function validateEmail(email) {
  return EMAIL_PATTERN.test(String(email || '').trim());
}

export function validatePhone(phone) {
  return PHONE_PATTERN.test(String(phone || '').trim());
}

export function validatePassword(password) {
  return STRONG_PASSWORD_PATTERN.test(String(password || ''));
}

export function validatePostalCode(postalCode) {
  return POSTAL_CODE_PATTERN.test(String(postalCode || '').trim());
}

export function validateName(name) {
  return NAME_PATTERN.test(String(name || '').trim());
}

export function validateSellerApplication(data) {
  const errors = {};
  const maxLengths = { full_name: 100, phone: 15, address: 180, city: 80, state: 80, postal_code: 5, notes: 1000 };
  for (const [field, max] of Object.entries(maxLengths)) {
    if (String(data[field] || '').length > max) errors[field] = `El campo ${field} no puede superar ${max} caracteres.`;
  }
  const curp = String(data.curp || '').trim();
  const rfc = String(data.rfc || '').trim();
  const idNumber = String(data.id_number || '').trim();
  const age = getAge(data.birth_date);

  if (!/^.{18}$/.test(curp)) errors.curp = 'La CURP debe tener exactamente 18 caracteres.';
  if (!/^.{12,13}$/.test(rfc)) errors.rfc = 'El RFC debe tener 12 o 13 caracteres.';
  if (idNumber.length < 5 || idNumber.length > 30) errors.id_number = 'El número de identificación debe tener entre 5 y 30 caracteres.';
  if (!validatePhone(data.phone)) errors.phone = 'Escribe un número de teléfono válido.';
  if (age === null) errors.birth_date = 'La fecha de nacimiento es obligatoria.';
  else if (age < 18) errors.birth_date = 'Debes tener al menos 18 años para ser vendedor.';

  const words = String(data.notes || '').trim().split(/\s+/).filter(Boolean).length;
  if (words < 20) errors.notes = 'Describe los productos que venderás con al menos 20 palabras.';
  return errors;
}
