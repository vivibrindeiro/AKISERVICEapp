// Banco de dados
Parse.initialize("Ltb0wpROgquEQ0DtQXX2PkT8h5AO8kzD9oNZenTx", "S9edHLrldKZYw93JlBlzVlFa2nfgCiwXD7h42gpq");
Parse.serverURL = 'https://parseapi.back4app.com';


function showLoading() {
    document.getElementById('loading').style.display = 'block'; 
    document.getElementById('hireServiceButton').disabled = true; 
}


function hideLoading() {
    document.getElementById('loading').style.display = 'none'; 
    document.getElementById('hireServiceButton').disabled = false; 
}


async function fetchServiceDetails(serviceId) {
    showLoading();
    const Service = Parse.Object.extend("Service");
    const query = new Parse.Query(Service);

    try {
        const service = await query.get(serviceId);
        await displayServiceDetails(service);
    } catch (error) {
        showError('Erro ao buscar detalhes do serviço: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Detalhes do serviço
async function displayServiceDetails(service) {
    
    document.getElementById('serviceTitle').innerText = service.get("title") || "Nome não disponível";
    document.getElementById('serviceDescription').innerText = service.get("description") || "Descrição não disponível";
    document.getElementById('serviceContact').innerText = service.get("contact") || "Contato não disponível";
    document.getElementById('serviceCategory').innerText = service.get("category") || "Categoria não disponível";
    document.getElementById('serviceRegion').innerText = service.get("region") || "Região não disponível";

    
    const professionalName = service.get("professionalName") || "Nome do profissional não disponível";
    document.getElementById('serviceProfessional').innerText = professionalName;

    // Botão de contratação WhatsApp
    const contactNumber = service.get("contact");
    const hireButton = document.getElementById('hireServiceButton');

    if (contactNumber) {
        const whatsappLink = `https://api.whatsapp.com/send?phone=${contactNumber}&text=Gostaria%20de%20contratar%20o%20serviço%20${encodeURIComponent(service.get("title"))}`;
        
        hireButton.addEventListener('click', function (e) {
            e.preventDefault(); // Impede o comportamento padrão do link (não recarregar a página)
            window.open(whatsappLink, '_blank'); 
        });
    } else {
        hireButton.setAttribute("href", '#'); 
    }

   
    fetchServiceReviews(service.id);

   
    displayOtherProfessionals(service);
}

// Busca e exibe as avaliações do serviço
async function fetchServiceReviews(serviceId) {
    const Review = Parse.Object.extend("Review");
    const query = new Parse.Query(Review);
    query.equalTo("service", { "__type": "Pointer", "className": "Service", "objectId": serviceId });

    try {
        const reviews = await query.find();
        displayReviews(reviews);
    } catch (error) {
        showError('Erro ao buscar avaliações: ' + error.message);
    }
}

// Exibe avaliações tabela
function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviews');
    reviewsContainer.innerHTML = ''; 

    if (reviews.length === 0) {
        reviewsContainer.innerHTML = '<p>Nenhuma avaliação disponível.</p>';
        return;
    }

    
    const table = document.createElement('table');
    table.classList.add('table', 'table-bordered', 'table-striped');

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Usuário</th>
            <th>Avaliação</th>
            <th>Comentário</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    reviews.forEach(review => {
        const row = document.createElement('tr');

        const userName = review.get('name') || 'Usuário Anônimo'; 
        const rating = review.get('rating') || 0; // Avaliação (número de estrelas)
        const comment = review.get('comment') || 'Sem comentário';

        
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHTML += '<i class="fas fa-star text-warning"></i>'; 
            } else {
                starsHTML += '<i class="far fa-star text-muted"></i>'; 
            }
        }

        row.innerHTML = `
            <td>${userName}</td>  <!-- Exibe o nome do usuário -->
            <td class="text-center">${starsHTML}</td>
            <td>${comment}</td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    reviewsContainer.appendChild(table);
}

// Exibe outros profissionais na mesma categoria
async function displayOtherProfessionals(service) {
    const category = service.get("category");
    const Service = Parse.Object.extend("Service");
    const query = new Parse.Query(Service);

    query.equalTo("category", category);
    query.notEqualTo("professionalId", service.get("professionalId"));
    query.exists("professionalId");

    try {
        const services = await query.find();
        const professionalsContainer = document.getElementById('otherProfessionals');
        professionalsContainer.innerHTML = '';

        if (services.length === 0) {
            professionalsContainer.innerHTML = '<p>Nenhum outro serviço encontrado.</p>';
        } else {
            services.forEach(service => {
                const professional = service.get('professionalId');
                const professionalName = professional ? professional.get('name') : 'Nome não disponível';
                const serviceTitle = service.get('title') || 'Serviço sem título';

                const serviceElement = document.createElement('div');
                serviceElement.classList.add('professional');
                serviceElement.innerHTML = `
                    <p><strong>${serviceTitle}</strong> - Oferecido por: ${professionalName}</p>
                `;
                professionalsContainer.appendChild(serviceElement);
            });
        }
    } catch (error) {
        console.error("Erro ao buscar outros serviços:", error);
    }
}

// Mensagem de erro
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.innerText = message;
    errorMessage.style.display = 'block';
}

// Contratar serviço
async function hireService(serviceId) {
    const currentUser = Parse.User.current();

    if (!currentUser) {
        showError("Você precisa estar logado para contratar um serviço.");
        return;
    }

    const Service = Parse.Object.extend("Service");
    const serviceQuery = new Parse.Query(Service);
    let service;

    try {
        service = await serviceQuery.get(serviceId);
    } catch (error) {
        showError("Erro ao buscar o serviço: " + error.message);
        return;
    }

    const Contract = Parse.Object.extend("Contract");
    const contract = new Contract();

    contract.set("service", service);
    contract.set("user", currentUser); // Atribui o usuário que contratou
    contract.set("status", "Pendente");
    contract.set("professional", service.get("professionalId"));

    try {
        await contract.save();
        alert("Serviço contratado com sucesso!");

        // Redireciona para o WhatsApp após salvar o contrato
        const whatsappLink = document.getElementById('hireServiceButton').getAttribute("data-whatsapp");
        if (whatsappLink) {
            window.location.href = whatsappLink;
        }
    } catch (error) {
        showError("Erro ao contratar o serviço: " + error.message);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('id');

    if (serviceId) {
        fetchServiceDetails(serviceId);
    } else {
        showError('ID do serviço não fornecido.');
    }

    
    const hireButton = document.getElementById('hireServiceButton');
    if (hireButton) {
        hireButton.addEventListener('click', function (e) {
            e.preventDefault();
            hireService(serviceId);
        });
    }
});
