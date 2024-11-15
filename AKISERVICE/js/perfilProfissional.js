
// Banco de dados
Parse.initialize("Ltb0wpROgquEQ0DtQXX2PkT8h5AO8kzD9oNZenTx", "S9edHLrldKZYw93JlBlzVlFa2nfgCiwXD7h42gpq");
Parse.serverURL = 'https://parseapi.back4app.com';

// Carregar  perfil do profissional
async function loadProfile() {
    const currentUser = Parse.User.current();

    if (currentUser) {
        
        document.getElementById('professionalName').innerText = currentUser.get('name') || 'N/A';
        document.getElementById('professionalEmail').innerText = currentUser.get('email') || 'N/A';
        document.getElementById('professionalPhone').innerText = currentUser.get('contact') || 'N/A';
        
        let region = currentUser.get('area') || 'Região não informada';
        region = region.charAt(0).toUpperCase() + region.slice(1).toLowerCase();
        document.getElementById('professionalRegion').innerText = region;

        
        const contactField = document.getElementById('serviceContact');
        contactField.value = currentUser.get('contact') || '';
        contactField.disabled = true;

        document.getElementById('editName').value = currentUser.get('name') || '';
        document.getElementById('editEmail').value = currentUser.get('email') || '';
        document.getElementById('editPhone').value = currentUser.get('contact') || '';
        document.getElementById('editRegion').value = region;
    } else {
        alert('Por favor, faça login para acessar seu perfil.');
    }
}


//Salva alterações perfil
async function saveProfileChanges() {
    const currentUser = Parse.User.current();
    
    const name = document.getElementById('editName').value;
    const email = document.getElementById('editEmail').value;
    const phone = document.getElementById('editPhone').value;
    const region = document.getElementById('editRegion').value;

    if (!name || !email || !phone || !region) {
        Swal.fire('Erro', 'Todos os campos são obrigatórios!', 'error');
        return;
    }

    currentUser.set('name', name);
    currentUser.set('email', email);
    currentUser.set('contact', phone);
    currentUser.set('area', region);

    try {
        await currentUser.save();
        Swal.fire('Sucesso', 'Perfil atualizado com sucesso!', 'success');
        loadProfile();  
        $('#editProfileModal').modal('hide');
    } catch (error) {
        Swal.fire('Erro', 'Não foi possível atualizar o perfil. Tente novamente.', 'error');
    }
}

// Validações e erros
function showErrorMessage(inputId, message) {
    const inputElement = document.getElementById(inputId);
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    inputElement.parentNode.appendChild(errorElement);
}


function clearErrorMessages() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
}

// Validar o campo de contato (exemplo simples para número de telefone)
function validateContact(contact) {
    const contactPattern = /^[0-9]{10,11}$/;  
    return contactPattern.test(contact);
}

// Função para validar a imagem (deve ser PNG, JPEG)
function validateImage(imageFile) {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    return validImageTypes.includes(imageFile.type);
}

// Função para adicionar serviço com validação detalhada
async function addService() {
    clearErrorMessages();  // Limpar mensagens de erro antigas
    let hasError = false;

    const title = document.getElementById('serviceTitle').value;
    const description = document.getElementById('serviceDescription').value;
    let category = document.getElementById('serviceCategory').value;
    let region = document.getElementById('serviceRegion').value;
    const contact = document.getElementById('serviceContact').value;
    const imageFile = document.getElementById('serviceImage').files[0];

    
    if (!title) {
        showErrorMessage('serviceTitle', 'Título do serviço é obrigatório.');
        hasError = true;
    }
    if (!description) {
        showErrorMessage('serviceDescription', 'Descrição é obrigatória.');
        hasError = true;
    }
    if (!category) {
        showErrorMessage('serviceCategory', 'Categoria é obrigatória.');
        hasError = true;
    }
    if (!region) {
        showErrorMessage('serviceRegion', 'Região é obrigatória.');
        hasError = true;
    }
    if (!contact || !validateContact(contact)) {
        showErrorMessage('serviceContact', 'Telefone inválido.');
        hasError = true;
    }
    if (!imageFile || !validateImage(imageFile)) {
        showErrorMessage('serviceImage', 'A imagem deve ser no formato PNG, JPE.');
        hasError = true;
    }

    if (hasError) {
        return;  
    }

    // Capitalizar a primeira letra de categoria e região
    category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    region = region.charAt(0).toUpperCase() + region.slice(1).toLowerCase();

    const Service = Parse.Object.extend('Service');
    const service = new Service();
    const currentUser = Parse.User.current();

    if (!currentUser) {
        Swal.fire('Erro', 'Você precisa estar logado para adicionar um serviço.', 'error');
        return;
    }

    // Salvar os dados do serviço
    service.set('name', title);  
    service.set('title', title);  
    service.set('category', category);
    service.set('region', region);
    service.set('description', description);
    service.set('contact', contact);
    service.set('professionalId', currentUser);
    service.set('professionalName', currentUser.get('name'));

    // Definir o campo de avaliação inicial como 0
    service.set('rating', 0);

    // Criar o objeto de imagem e associá-lo ao serviço
    const file = new Parse.File(imageFile.name, imageFile);
    service.set('image', file);

    // Salvar o serviço no banco de dados
    try {
        await service.save();
        Swal.fire('Sucesso', 'Serviço adicionado com sucesso!', 'success');
        loadServices();  // Recarregar a lista de serviços
        document.getElementById('addServiceForm').reset();  // Limpar os campos do formulário
    } catch (error) {
        Swal.fire('Erro', 'Não foi possível adicionar o serviço. Tente novamente. Erro: ' + error.message, 'error');
    }
}


// Carregar os serviços cadastrados 
async function loadServices() {
    const currentUser = Parse.User.current();
    const Service = Parse.Object.extend('Service');
    const query = new Parse.Query(Service);
    query.equalTo('professionalId', currentUser);
    try {
        const services = await query.find();
        const servicesTableBody = document.getElementById('servicesTableBody');
        servicesTableBody.innerHTML = '';

        services.forEach(service => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.get('name')}</td>
                <td>${service.get('description')}</td>
                <td>${service.get('category')}</td>
                <td>${service.get('region')}</td>
                <td>${service.get('contact')}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editService('${service.id}')">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteService('${service.id}')">Excluir</button>
                </td>
            `;
            servicesTableBody.appendChild(row);
        });
    } catch (error) {
        Swal.fire('Erro', 'Não foi possível carregar os serviços. Tente novamente.', 'error');
    }
}


// Editar serviço
async function editService(serviceId) {
    const Service = Parse.Object.extend('Service');
    const query = new Parse.Query(Service);
    try {
        const service = await query.get(serviceId);
        document.getElementById('editServiceName').value = service.get('name');
        document.getElementById('editServiceDescription').value = service.get('description');
        document.getElementById('editServiceCategory').value = service.get('category');
        document.getElementById('editServiceRegion').value = service.get('region');
        document.getElementById('editServiceContact').value = service.get('contact');  // Se o campo 'contact' também for necessário

        // Salvar alterações após editar (usando o evento submit do formulário)
        const form = document.getElementById('editServiceForm');
        form.onsubmit = async function(event) {
            event.preventDefault();  
            const serviceName = document.getElementById('editServiceName').value;
            const serviceDescription = document.getElementById('editServiceDescription').value;
            const serviceCategory = document.getElementById('editServiceCategory').value;
            const serviceRegion = document.getElementById('editServiceRegion').value;
            const serviceContact = document.getElementById('editServiceContact').value;

            // Verifica se os campos estão preenchidos
            if (!serviceName || !serviceDescription || !serviceCategory || !serviceRegion || !serviceContact) {
                Swal.fire('Erro', 'Todos os campos devem ser preenchidos.', 'error');
                return;
            }

            service.set('name', serviceName);
            service.set('description', serviceDescription);
            service.set('category', serviceCategory);
            service.set('region', serviceRegion);
            service.set('contact', serviceContact);

            try {
                await service.save();
                Swal.fire('Sucesso', 'Serviço atualizado com sucesso!', 'success');
                loadServices();  // Recarregar a lista de serviços
                $('#editServiceModal').modal('hide');  // Fechar o modal
            } catch (error) {
                Swal.fire('Erro', 'Não foi possível atualizar o serviço. Tente novamente.', 'error');
            }
        };

        $('#editServiceModal').modal('show');  // Abrir o modal
    } catch (error) {
        Swal.fire('Erro', 'Não foi possível carregar o serviço para edição. Tente novamente.', 'error');
    }
}


// Excluir um serviço
async function deleteService(serviceId) {
    const Service = Parse.Object.extend('Service');
    const query = new Parse.Query(Service);
    try {
        const service = await query.get(serviceId);
        await service.destroy();
        Swal.fire('Sucesso', 'Serviço excluído com sucesso!', 'success');
        loadServices();  // Recarregar a lista de serviços
    } catch (error) {
        Swal.fire('Erro', 'Não foi possível excluir o serviço. Tente novamente.', 'error');
    }
}


// Carregar o histórico de serviços
async function loadServiceHistory() {  
    const currentUser = Parse.User.current();
    const Contract = Parse.Object.extend('Contract');
    const contractQuery = new Parse.Query(Contract);
    contractQuery.equalTo('user', currentUser); 
    contractQuery.include('service');  
    contractQuery.include('professional');  

    try {
        const contracts = await contractQuery.find();
        const historyTableBody = document.getElementById('servicesHistoryTableBody');
        historyTableBody.innerHTML = ''; 

        
        for (let contract of contracts) {
            const service = contract.get('service'); 
            const professional = contract.get('professional'); 

            // Consultando as avaliações 
            const Review = Parse.Object.extend('Review');
            const reviewQuery = new Parse.Query(Review);
            reviewQuery.equalTo('service', service);  
            reviewQuery.include('user');  
            const reviews = await reviewQuery.find();

            
            if (reviews.length > 0) {
                // Extraindo o nome do usuário que fez a avaliação e a classificação
                const review = reviews[0];  
                const user = review.get('user');
                const userName = user ? user.get('name') : 'Nome não disponível';
                const rating = review.get('rating') ? review.get('rating') : 0;
                const comment = review.get('comment') ? review.get('comment') : 'Sem comentário';

                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${contract.createdAt.toLocaleDateString()}</td>
                    <td>${service.get('name')}</td>
                    <td>${comment}</td>
                    <td>${renderStars(rating)}</td>  <!-- Exibindo a avaliação em estrelas -->
                `;

                
                historyTableBody.appendChild(row);

        
                if (reviews.length > 1) {
                    // Exibir que existem outras avaliações
                    const otherReviewsRow = document.createElement('tr');
                    otherReviewsRow.innerHTML = `
                        <td colspan="4" class="text-muted">Existem mais avaliações para este serviço.</td>
                    `;
                    historyTableBody.appendChild(otherReviewsRow);
                }
            }
        }

    } catch (error) {
        Swal.fire('Erro', 'Não foi possível carregar o histórico de serviços. Tente novamente.', 'error');
    }
}

function renderStars(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHtml += '<span class="fa fa-star" style="color: gold;"></span>';
        } else {
            starsHtml += '<span class="fa fa-star" style="color: lightgray;"></span>';
        }
    }
    return starsHtml;
}

window.onload = function() {
    loadProfile();
    loadServices();
    loadServiceHistory();
    
    document.getElementById('addServiceButton').onclick = addService;
    document.getElementById('saveProfileChanges').onclick = saveProfileChanges;
};

