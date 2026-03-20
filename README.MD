# 🥗 Dieta Fácil - V1 (Inteligência Nutricional)

![Status](https://img.shields.io/badge/Status-Versão%201.0-green?style=for-the-badge)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007acc.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)

> **Dieta Fácil** é uma aplicação de alta performance para análise nutricional. O sistema utiliza uma arquitetura híbrida de dados para entregar informações precisas sobre macronutrientes em segundos, utilizando Inteligência Artificial de última geração.

---

## 📸 Screenshots do Projeto

| Tela de Pesquisa | Cálculo de Macros |
| :---: | :---: |
|  ![Tela Principal](./public/screenshots/home.png) | 
|  ![Tela Principal Mobile](./public/screenshots/homeMobile.png) | 
|  ![Resultado Nutricional](./public/screenshots/macro.png) |
|  ![Resultado Nutricional](./public/screenshots/macroMobile.png) |

| Controle de Água | Ranking e Gamificação |
| :---: | :---: |
| ![Interface de Água](./public/screenshots/water.png) |
| ![Interface de Água](./public/screenshots/waterMobile.png) | 
| ![Interface de Água](./public/screenshots/waterAdc.png) | 
| ![Interface de Água](./public/screenshots/waterAdcMobile.png) | 
|  ![Tela de Ranking](./public/screenshots/ranking.png) |
|  ![Tela de Ranking](./public/screenshots/rankingFunc.png) |
|  ![Tela de Ranking](./public/screenshots/rankingFuncMobile.png) |

| Historico | Calendario |
| :---: | :---: |
| ![Interface de Água](./public/screenshots/historicoCalendario.png) |
| ![Interface de Água](./public/screenshots/historicoCalendarioMobile.png) |
| ![Interface de Água](./public/screenshots/rendimentoDiaTot.png) |
| ![Interface de Água](./public/screenshots/rendimentoDiaTotMobile.png) |
| ![Interface de Água](./public/screenshots/refeicaoSalva.png) |
| ![Interface de Água](./public/screenshots/refeicaoSalvaMobile.png) |

| Dados |
| :---: |
| ![Interface de Água](./public/screenshots/dadosPerfil.png) |
| ![Interface de Água](./public/screenshots/dadosPerfilMobile.png) |

---

## 🛠️ Tecnologias e Bibliotecas

O projeto foi desenvolvido focando em **Clean Code** e **Melhores Práticas de Arquitetura**:

* **React + TypeScript:** Interface reativa e tipagem forte para evitar erros em runtime.
* **Vite:** Ferramenta de build de nova geração para desenvolvimento ultra-rápido.
* **Google Generative AI (Gemini 2.5-Flash):** Integração com o SDK oficial para análise dinâmica de alimentos.
* **Three.js:** Utilizado para elementos visuais 3D imersivos (visualização de nutrientes).
* **Tailwind CSS:** Framework utilitário para design responsivo e moderno.

---

## 🏗️ Arquitetura de Dados (Camadas)

Para otimizar as requisições e reduzir custos de API, implementamos um sistema de **Cache em 3 Camadas**:

1.  **JSON Estático (`foodDatabase.json`):** Consulta instantânea em banco de dados local pré-definido.
2.  **LocalStorage:** Cache persistente no navegador do usuário para pesquisas repetidas.
3.  **Gemini AI (Fallback):** Caso o alimento não exista nas camadas anteriores, a IA processa e retorna o JSON nutricional em tempo real.

---

## 🚀 Como Instalar e Rodar

### 1. Pré-requisitos
* Node.js instalado (v18+)
* Chave de API do [Google AI Studio](https://aistudio.google.com/)

### 2. Instalação Automática (Windows)
Nós automatizamos o setup! Basta executar o script na raiz do projeto:
```bash
.\setup.bat
```

### 3. Configuração Manual
Crie um arquivo .env na raiz do projeto e insira sua chave:

Snippet de código
```bash
VITE_GEMINI_API_KEY=SUA_CHAVE_AQUI
```

### 4. Execução
```bash
npm run dev
```

### 👥 Autores e Colaboradores
**Henrique Castro - Engenharia de Software / Back-end & Arquitetura**

## 📌 Roadmap (V2)
* [ ] Migração do Cache para Firebase Firestore.

* [ ] Sistema de Autenticação de Usuários.

* [ ] Gráficos de progresso semanal.
