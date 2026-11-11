// Toni ai/public/app.js

// TONI AI 3.0
// CHAT + PLANOS + PAGAMENTO PIX NUBANK

const entrada = document.getElementById('entrada');
const botaoEnviar = document.getElementById('enviar');
const mensagens = document.getElementById('mensagens');

const historico = [];

// ==================================
// CONFIGURAÇÃO PIX NUBANK
// ==================================

const PIX_CHAVE_TELEFONE = '+5527998923665';

// ==================================
// MENSAGENS DO CHAT
// ==================================

function adicionarMensagem(texto, tipo) {
    const mensagem = document.createElement('div');

    mensagem.classList.add('mensagem', tipo);
    mensagem.textContent = texto;

    mensagens.appendChild(mensagem);
    mensagens.scrollTop = mensagens.scrollHeight;

    return mensagem;
}

// ==================================
// CHAT COM A TONI AI
// ==================================

async function enviarMensagem() {
    const texto = entrada.value.trim();

    if (!texto || botaoEnviar.disabled) return;

    adicionarMensagem(texto, 'usuario');

    historico.push({
        role: 'user',
        content: texto
    });

    entrada.value = '';
    entrada.focus();

    botaoEnviar.disabled = true;
    botaoEnviar.textContent = 'Pensando...';

    try {
        const resposta = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: historico
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.error || 'Erro ao consultar a Toni AI.'
            );
        }

        adicionarMensagem(dados.resposta, 'ia');

        historico.push({
            role: 'assistant',
            content: dados.resposta
        });

    } catch (erro) {
        adicionarMensagem(
            'Não consegui responder: ' + erro.message,
            'ia'
        );

        console.error('Erro:', erro);

    } finally {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = 'Enviar';
        entrada.focus();
    }
}

botaoEnviar.addEventListener('click', enviarMensagem);

entrada.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        enviarMensagem();
    }
});

// ==================================
// PLANOS TONI AI
// ==================================

const planoEscolhido = document.getElementById('planoEscolhido');
const resumoPlano = document.getElementById('resumoPlano');
const resumoPreco = document.getElementById('resumoPreco');

const assinatura = document.getElementById('assinatura');
const continuarAssinatura = document.getElementById('continuarAssinatura');

const areaPix = document.getElementById('areaPix');
const chavePixExibida = document.getElementById('chavePixExibida');
const copiarPix = document.getElementById('copiarPix');
const mensagemPix = document.getElementById('mensagemPix');

// ==================================
// ATUALIZAR RESUMO
// ==================================

function atualizarResumo() {
    const plano = planoEscolhido.value;

    if (plano === 'MAX') {
        resumoPlano.textContent = 'TONI MAX';
        resumoPreco.textContent = 'R$ 60,50/mês';
    } else {
        resumoPlano.textContent = 'TONI PRO';
        resumoPreco.textContent = 'R$ 29,90/mês';
    }

    areaPix.hidden = true;
    mensagemPix.textContent = '';
}

planoEscolhido.addEventListener('change', atualizarResumo);

// ==================================
// SELECIONAR PLANO
// ==================================

function selecionarPlano(plano) {
    if (plano === 'FREE') {
        adicionarMensagem(
            'Você está utilizando o plano TONI FREE. Aproveite sua Toni AI!',
            'ia'
        );
        return;
    }

    planoEscolhido.value = plano;
    atualizarResumo();

    assinatura.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

window.selecionarPlano = selecionarPlano;

// ==================================
// BOTÃO PLANO FREE
// ==================================

const botaoFree = document.querySelector('.plano .botao-plano');

if (botaoFree) {
    botaoFree.addEventListener('click', function() {
        selecionarPlano('FREE');
    });
}

// ==================================
// GERAR PAGAMENTO PIX
// ==================================

continuarAssinatura.addEventListener('click', function() {
    const nome = document.getElementById('nomeCliente').value.trim();
    const email = document.getElementById('emailCliente').value.trim();

    if (!nome) {
        alert('Preencha seu nome completo.');
        return;
    }

    if (!email) {
        alert('Preencha seu e-mail.');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Digite um endereço de e-mail válido.');
        return;
    }

    const plano = planoEscolhido.value;

    const nomeDoPlano = plano === 'MAX'
        ? 'TONI MAX'
        : 'TONI PRO';

    const preco = plano === 'MAX'
        ? 'R$ 60,50'
        : 'R$ 29,90';

    chavePixExibida.textContent = PIX_CHAVE_TELEFONE;

    mensagemPix.textContent =
        'Plano selecionado: ' + nomeDoPlano +
        ' | Valor: ' + preco;

    areaPix.hidden = false;

    areaPix.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
});

// ==================================
// COPIAR CHAVE PIX
// ==================================

copiarPix.addEventListener('click', async function() {
    if (!PIX_CHAVE_TELEFONE) {
        mensagemPix.textContent =
            'Configure sua chave Pix primeiro.';
        return;
    }

    try {
        await navigator.clipboard.writeText(PIX_CHAVE_TELEFONE);

        mensagemPix.textContent =
            'Chave Pix copiada! Abra o Nubank e faça o pagamento.';

    } catch (erro) {
        mensagemPix.textContent =
            'Não foi possível copiar automaticamente. Selecione e copie a chave exibida acima.';

        console.error('Erro ao copiar Pix:', erro);
    }
});

// ==================================
// INICIALIZAÇÃO
// ==================================

atualizarResumo();

console.log('TONI AI 3.0 iniciada com sucesso!');
