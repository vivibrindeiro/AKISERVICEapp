document.addEventListener("DOMContentLoaded", function () {
    initializeParse();
    addEventListeners();
    disableAutocomplete(["loginForm", "registerForm", "passwordRecoveryForm"]);
});

// Inicializa o Parse apenas uma vez
function initializeParse() {
    if (!window.isParseInitialized) {
        
// Banco de dados
Parse.initialize("Ltb0wpROgquEQ0DtQXX2PkT8h5AO8kzD9oNZenTx", "S9edHLrldKZYw93JlBlzVlFa2nfgCiwXD7h42gpq");
Parse.serverURL = 'https://parseapi.back4app.com';
        window.isParseInitialized = true;
    }
}


function addEventListeners() {
    if (!window.listenersAdded) {
        document.getElementById("showRegister").addEventListener("click", toggleForm);
        document.getElementById("showLogin").addEventListener("click", toggleForm);
        document.getElementById("userType").addEventListener("change", toggleProfessionalFields);
        document.getElementById("loginForm").addEventListener("submit", handleLogin);
        document.getElementById("registerForm").addEventListener("submit", handleRegister);
        document.getElementById("passwordRecoveryForm").addEventListener("submit", handlePasswordRecovery);
        window.listenersAdded = true;
    }
}


function disableAutocomplete(formIds) {
    formIds.forEach(formId => document.getElementById(formId).setAttribute("autocomplete", "off"));
}

// Alterna entre as seções de Login e Cadastro
function toggleForm(event) {
    event.preventDefault();
    const isRegister = event.target.id === "showRegister";
    toggleDisplay("loginSection", !isRegister);
    toggleDisplay("registerSection", isRegister);
}


function toggleProfessionalFields(event) {
    const isProfessional = event.target.value === "profissional";
    toggleDisplay("professionalFields", isProfessional);
    toggleDisplay("registerRegionField", isProfessional);
}


async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!validateFields([email, password], "Preencha todos os campos: e-mail e senha.")) return;

    try {
        await Parse.User.logIn(email, password);
        window.location.href = "pagInicial.html";
        resetForm("loginForm");
    } catch {
        showAlert("Usuario ínvalido. Faça seu cadastro e tente novamente.");
    }
}


async function logOut() {
    try {
        await Parse.User.logOut();
        console.log("Logout realizado.");
        window.location.href = "login.html";
    } catch (error) {
        console.error("Erro ao desconectar:", error);
    }
}

// Função de registro
async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const userType = document.getElementById("userType").value;
    const contact = document.getElementById("registerContact").value.trim();
    const area = document.getElementById("registerArea").value.trim();
    const region = document.getElementById("registerRegion").value.trim();

    if (!validateFields([name, email, password, userType], "Nome, e-mail, senha e tipo de usuário são obrigatórios.")) return;
    if (userType === "profissional" && !validateFields([contact, area, region], "Para profissionais, os campos de contato, área e região são obrigatórios.")) return;

    try {
        if (await checkUserExists(email)) {
            showAlert("Este e-mail já está cadastrado. Tente outro ou faça login.");
        } else {
            await registerNewUser({ name, email, password, userType, contact, area, region });
            showAlert("Cadastro realizado com sucesso!");
            resetForm("registerForm");
            toggleDisplay("loginSection", true);
            toggleDisplay("registerSection", false);
        }
    } catch (error) {
        console.error(error);
        showAlert("Não foi possível completar o cadastro. Tente novamente.");
    }
}

// Verifica se o usuário já existe
async function checkUserExists(email) {
    const query = new Parse.Query(Parse.User);
    query.equalTo("username", email);
    return await query.first();
}


async function registerNewUser({ name, email, password, userType, contact, area, region }) {
    const user = new Parse.User();
    user.set("username", email);
    user.set("email", email);
    user.set("password", password);
    user.set("name", name);
    user.set("userType", userType);

    if (userType === "profissional") {
        user.set("contact", contact);
        user.set("area", area);
        user.set("region", region);
    }

    await user.signUp();
}


function resetForm(formId) {
    document.getElementById(formId).reset();
}


function toggleDisplay(elementId, show) {
    document.getElementById(elementId).style.display = show ? "block" : "none";
}

// Recuperação de senha
async function handlePasswordRecovery(event) {
    event.preventDefault();
    const email = document.getElementById("recoveryEmail").value.trim();

    if (!validateFields([email], "Informe o e-mail para recuperação.")) return;

    try {
        await Parse.User.requestPasswordReset(email);
        showAlert("Enviamos um link para recuperação no seu e-mail.");
        resetForm("passwordRecoveryForm");
    } catch {
        showAlert("Erro ao enviar o link. Verifique o e-mail e tente novamente.");
    }
}

// Validação de campos obrigatórios
function validateFields(fields, message) {
    if (fields.some(field => !field)) {
        showAlert(message);
        return false;
    }
    return true;
}


function showAlert(message) {
    alert(message);
}
