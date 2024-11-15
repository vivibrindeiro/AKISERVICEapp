
// Inicializar o Parse
Parse.initialize("Ltb0wpROgquEQ0DtQXX2PkT8h5AO8kzD9oNZenTx", "S9edHLrldKZYw93JlBlzVlFa2nfgCiwXD7h42gpq");
Parse.serverURL = 'https://parseapi.back4app.com';

// Carregar dados do perfil do usuário
async function loadUserProfile() {
    const currentUser = Parse.User.current();
    if (currentUser) {
        document.getElementById("userName").innerText = currentUser.get("name");
        document.getElementById("userEmail").innerText = currentUser.get("email");
        document.getElementById("editUserName").value = currentUser.get("name");
        document.getElementById("editUserEmail").value = currentUser.get("email");
    } else {
        Swal.fire("Erro", "Usuário não está logado", "error");
    }
}

// Salvar alterações no perfil
document.getElementById("saveChanges").addEventListener("click", async () => {
    const currentUser = Parse.User.current();
    if (currentUser) {
        currentUser.set("name", document.getElementById("editUserName").value);
        currentUser.set("email", document.getElementById("editUserEmail").value);
        try {
            await currentUser.save();
            Swal.fire("Sucesso", "Informações atualizadas com sucesso!", "success");
            loadUserProfile(); // Recarrega as informações atualizadas no perfil
            $('#editModal').modal('hide');
        } catch (error) {
            Swal.fire("Erro", error.message, "error");
        }
    }
});

// Verificar se o serviço já foi avaliado
async function checkIfReviewed(serviceId, userId) {
    const Review = Parse.Object.extend("Review");
    const reviewQuery = new Parse.Query(Review);
    reviewQuery.equalTo("service", { __type: "Pointer", className: "Service", objectId: serviceId });
    reviewQuery.equalTo("user", { __type: "Pointer", className: "_User", objectId: userId });
    const existingReview = await reviewQuery.first();
    return existingReview != null; // Retorna true se já existe uma avaliação
}

// Carregar os serviços contratados

async function carregarServicosContratados() {
    const usuarioAtual = Parse.User.current();
    if (!usuarioAtual) return;

    const Contract = Parse.Object.extend("Contract");
    const query = new Parse.Query(Contract);
    query.equalTo("user", usuarioAtual);
    query.include("service"); // Incluir o serviço
    query.descending("createdAt");

    try {
        const contratacoes = await query.find();
        const tbody = $("#contratadosTable tbody");
        tbody.empty(); // Limpar o conteúdo da tabela antes de adicionar novos dados

        for (const contratacao of contratacoes) {
            const servico = contratacao.get("service");
            const professionalName = servico ? servico.get("professionalName") : "Profissional Indisponível"; // Acesse o nome do profissional diretamente
            const status = contratacao.get("status");
            const dataContratacao = new Date(contratacao.createdAt).toLocaleDateString();

            const userId = usuarioAtual.id;
            const serviceId = servico ? servico.id : null;
            let avaliacaoBotao = "";

            // Verificar se o serviço foi concluído e se já foi avaliado
            if (status === "Concluído" && serviceId && !(await checkIfReviewed(serviceId, userId))) {
                avaliacaoBotao = `<button class="btn btn-primary avaliar-servico" data-id="${contratacao.id}" data-service-id="${serviceId}">Avaliar</button>`;
            } else if (status === "Avaliado" || (await checkIfReviewed(serviceId, userId))) {
                avaliacaoBotao = `<span class="text-success">Serviço Avaliado!</span>`;
            } else if (status === "Pendente") {
                avaliacaoBotao = `<span class="text-warning">Aguardando conclusão</span>`;
            } else if (status === "Cancelado") {
                avaliacaoBotao = `<span class="text-danger">Avaliável apenas se concluído</span>`;
            }

            const statusSelect = `
                <select class="form-control status-select" data-id="${contratacao.id}">
                    <option value="Pendente" ${status === "Pendente" ? "selected" : ""}>Pendente</option>
                    <option value="Concluído" ${status === "Concluído" ? "selected" : ""}>Concluído</option>
                    <option value="Cancelado" ${status === "Cancelado" ? "selected" : ""}>Cancelado</option>
                </select>`;

            // Adicionando o nome do profissional ao lado do nome do serviço
            const linha = `
                <tr>
                    <td>${dataContratacao}</td>
                    <td>${servico ? servico.get("name") : "Serviço Indisponível"}</td>
                    <td>${professionalName}</td>
                    <td>${statusSelect}</td>
                    <td>${avaliacaoBotao}</td>
                </tr>`;
            tbody.append(linha);
        }

        // Atualizar status
        $(".status-select").change(async function () {
            const contratacaoId = $(this).data("id");
            const novoStatus = $(this).val();

            const Contract = Parse.Object.extend("Contract");
            const contratacaoQuery = new Parse.Query(Contract);
            try {
                const contratacao = await contratacaoQuery.get(contratacaoId);
                contratacao.set("status", novoStatus);
                await contratacao.save();
                carregarServicosContratados(); // Recarregar a lista de serviços contratados após a atualização
            } catch (error) {
                Swal.fire("Erro", "Não foi possível atualizar o status", "error");
            }
        });
    } catch (error) {
        console.error("Erro ao carregar serviços contratados:", error);
        Swal.fire("Erro", "Não foi possível carregar os serviços contratados", "error");
    }
}


// Exibir o formulário de avaliação
$(document).on("click", ".avaliar-servico", function () {
    const hireId = $(this).data("id");
    document.getElementById("currentServiceId").value = hireId;
    document.getElementById("avaliacaoForm").style.display = "block";
});

// Enviar avaliação
document.getElementById("submitRating").addEventListener("click", async () => {
    const hireId = document.getElementById("currentServiceId").value;
    const rating = parseInt(document.getElementById("serviceRating").value);
    const comment = document.getElementById("serviceComment").value;

    if (!rating) {
        Swal.fire("Erro", "Por favor, selecione uma classificação", "error");
        return;
    }

    try {
        const hireQuery = new Parse.Query("Contract");
        const hire = await hireQuery.get(hireId);
        const service = hire.get("service");

        // Criar uma nova avaliação
        const Review = Parse.Object.extend("Review");
        const review = new Review();
        review.set("service", service);
        review.set("user", Parse.User.current());
        review.set("professional", hire.get("professional"));
        review.set("rating", rating);
        review.set("comment", comment);

        // Definir o nome do usuário na avaliação
        const currentUser = Parse.User.current();
        if (currentUser) {
            review.set("name", currentUser.get("name")); // Armazenar o nome do usuário na coluna 'name'
        }

        await review.save();

        // Atualizar status para "Concluído" após avaliação
        hire.set("status", "Concluído");
        await hire.save();

        Swal.fire("Sucesso", "Avaliação enviada com sucesso!", "success");
        document.getElementById("avaliacaoForm").style.display = "none";
        document.getElementById("ratingForm").reset();
        carregarServicosContratados();
    } catch (error) {
        Swal.fire("Erro", "Não foi possível enviar a avaliação. " + error.message, "error");
    }
});

// Inicializar as funções
window.onload = () => {
    loadUserProfile();
    carregarServicosContratados();
};
console.log(profissional);