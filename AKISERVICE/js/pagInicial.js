Parse.initialize("Ltb0wpROgquEQ0DtQXX2PkT8h5AO8kzD9oNZenTx", "S9edHLrldKZYw93JlBlzVlFa2nfgCiwXD7h42gpq");
Parse.serverURL = 'https://parseapi.back4app.com';

const currentUser = Parse.User.current();
if (!currentUser) {
    window.location.href = 'login.html';
} else {
    const userType = currentUser.get('userType');
    const profileLink = document.getElementById('profileLink');
    if (profileLink) {
        profileLink.href = userType === 'profissional' ? 'perfilProfissional.html' : 'perfilUsuario.html';
        document.getElementById('userType').textContent = userType === 'profissional' ? 'Meu Perfil' : 'Perfil';
    }
}

// Função para capitalizar a primeira letra de uma string
const capitalizeFirstLetter = string => string.charAt(0).toUpperCase() + string.slice(1);


async function recalculateAverageRating(serviceId) {
    try {
        const reviews = await new Parse.Query("Review").equalTo("serviceId", serviceId).find();
        const totalRatings = reviews.reduce((sum, review) => sum + review.get("rating"), 0);
        const averageRating = reviews.length ? totalRatings / reviews.length : 0;

        const service = await new Parse.Query("Service").get(serviceId);
        service.set("rating", averageRating);
        await service.save();
    } catch (error) {
        console.error("Erro ao recalcular a média de avaliações:", error);
    }
}

// Carregar serviços 
async function loadServicesAndCategories() {
    try {
        const services = await new Parse.Query("Service")
            .include("professionalId")
            .descending("createdAt")
            .limit(10)
            .find();
        
        renderServices(services);
        populateCategoryAndRegionFilters(services);
    } catch (error) {
        alert("Erro ao carregar serviços: " + error.message);
    }
}

// Renderizar serviços
function renderServices(services) {
    const serviceList = document.getElementById('serviceList');
    if (!serviceList) return;

    serviceList.innerHTML = services.length === 0
        ? '<p class="text-muted">Nenhum serviço encontrado.</p>'
        : services.map(service => createServiceCard(service)).join('');
}

// Criar cartão de serviço
function createServiceCard(service) {
    const imageUrl = service.get("image") ? service.get("image").url() : 'default-image.jpg';
    const rating = service.get("rating") || 0;
    const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
    const professional = service.get("professionalId");
    const formattedRegion = (service.get("region") || professional?.get("region") || "Região não definida").replace(/^\w/, c => c.toUpperCase());
    const category = service.get("category") || "Sem categoria";

    return `
        <div class="col-md-4 col-sm-6 mb-4">
            <div class="card h-100 text-center" style="border: 1px solid #ced4da; border-radius: 8px; overflow: hidden;">
                <img src="${imageUrl}" class="card-img-top" alt="Imagem do Serviço" loading="lazy">
                <div class="card-body">
                    <h5 class="card-title text-truncate">${service.get("title") || 'Serviço Sem Título'}</h5>
                    <p class="card-text"><strong>Categoria:</strong> ${category}</p>
                    <p class="card-text region-info">Atendimento em: ${formattedRegion}</p>
                    <a href="detalhesServi.html?id=${service.id}" class="btn btn-primary mt-2">Ver Detalhes</a>
                </div>
            </div>
        </div>`;
}

// Popular filtros de categoria e região
async function populateCategoryAndRegionFilters(services) {
    const categoryFilter = document.getElementById('filterCategory');
    const regionFilter = document.getElementById('filterRegion');
    if (!categoryFilter || !regionFilter) return;

    const categories = Array.from(new Set(services.map(service => service.get("category")).filter(Boolean)));
    const regions = Array.from(new Set(services.map(service => service.get("region")).filter(Boolean)))
        .map(region => capitalizeFirstLetter(region));

    categoryFilter.innerHTML = ['Todas as categorias', ...categories].map(cat => `<option value="${cat}">${cat}</option>`).join('');
    regionFilter.innerHTML = ['Todas as regiões', ...regions].map(region => `<option value="${region}">${region}</option>`).join('');
}

// Filtrar serviços
async function filterServices() {
    const selectedCategory = document.getElementById('filterCategory').value;
    const selectedRegion = document.getElementById('filterRegion').value;

    const query = new Parse.Query("Service").include("professionalId");

    if (selectedCategory !== 'Todas as categorias') query.equalTo("category", selectedCategory);
    if (selectedRegion !== 'Todas as regiões') query.equalTo("region", selectedRegion);

    try {
        const results = await query.find();
        renderServices(results);
    } catch (error) {
        alert("Erro ao buscar serviços: " + error.message);
    }
}

document.getElementById('filterCategory')?.addEventListener('change', filterServices);
document.getElementById('filterRegion')?.addEventListener('change', filterServices);

// Carregar serviços e categorias 
loadServicesAndCategories();

// Deslogar usuário
document.getElementById('logoutButton')?.addEventListener('click', async () => {
    try {
        await Parse.User.logOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao deslogar:', error);
    }
});
