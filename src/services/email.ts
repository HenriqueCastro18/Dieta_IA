// src/services/email.ts
import emailjs from '@emailjs/browser';

// Substitua pelos seus IDs do EmailJS após criar a conta
const SERVICE_ID = "seu_service_id";
const TEMPLATE_ID = "seu_template_id";
const PUBLIC_KEY = "sua_public_key";

export const EmailService = {
  generateOTP: () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Gera 6 dígitos
  },

  sendOTP: async (userEmail: string, userName: string, otp: string) => {
    try {
      const templateParams = {
        to_email: userEmail,
        to_name: userName,
        otp_code: otp,
      };

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
      return true;
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      return false;
    }
  }
};