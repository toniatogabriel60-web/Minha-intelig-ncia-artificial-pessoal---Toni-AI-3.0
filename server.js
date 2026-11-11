// Toni ai/server.js

// TONI AI 3.0 - SERVIDOR PRINCIPAL

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

// ==================================
// CONEXÃO COM SUPABASE
// ==================================

let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {

    supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    );

    console.log('Supabase configurado com sucesso!');

} else {
    console.log('ATENÇÃO: Credenciais do Supabase não encontradas.');
}

// Verificar conexão configurada
function verificarSupabase(res) {
    if (!supabase) {
        res.status(500).json({
            error: 'Supabase não está configurado no arquivo .env.'
        });

        return false;
    }

    return true;
}

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================================
// CADASTRO DE USUÁRIOS
// ==================================

app.post('/api/auth/register', async (req, res) => {

    try {

        if (!verificarSupabase(res)) return;

        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                error: 'Preencha nome, e-mail e senha.'
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({
                error: 'A senha precisa ter pelo menos 8 caracteres.'
            });
        }

        const { data, error } = await supabase.auth.signUp({

            email: email.trim(),

            password: senha,

            options: {
                data: {
                    full_name: nome.trim()
                }
            }

        });

        if (error) {
            return res.status(400).json({
                error: error.message
            });
        }

        res.status(201).json({
            mensagem: data.session
                ? 'Cadastro realizado com sucesso!'
                : 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.',

            usuario: data.user,

            sessao: data.session
        });

    } catch (erro) {

        console.error('Erro no cadastro:', erro);

        res.status(500).json({
            error: 'Não foi possível realizar o cadastro.'
        });
    }
});

// ==================================
// LOGIN DE USUÁRIOS
// ==================================

app.post('/api/auth/login', async (req, res) => {

    try {

        if (!verificarSupabase(res)) return;

        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                error: 'Informe seu e-mail e sua senha.'
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({

            email: email.trim(),

            password: senha

        });

        if (error) {
            return res.status(401).json({
                error: 'E-mail ou senha incorretos.'
            });
        }

        res.json({
            mensagem: 'Login realizado com sucesso!',

            usuario: data.user,

            sessao: data.session
        });

    } catch (erro) {

        console.error('Erro no login:', erro);

        res.status(500).json({
            error: 'Não foi possível realizar o login.'
        });
    }
});

// ==================================
// CONSULTAR PERFIL DO USUÁRIO
// ==================================

app.get('/api/auth/profile', async (req, res) => {

    try {

        if (!verificarSupabase(res)) return;

        const autorizacao = req.headers.authorization;

        if (!autorizacao || !autorizacao.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Token de autenticação não informado.'
            });
        }

        const token = autorizacao.substring(7);

        const { data: usuarioData, error: usuarioErro } =
            await supabase.auth.getUser(token);

        if (usuarioErro || !usuarioData.user) {
            return res.status(401).json({
                error: 'Sessão inválida ou expirada.'
            });
        }

        const clienteAutenticado = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                },
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            }
        );

        const { data: perfil, error: perfilErro } =
            await clienteAutenticado
                .from('profiles')
                .select('id, full_name, plan, created_at')
                .eq('id', usuarioData.user.id)
                .single();

        if (perfilErro) {
            return res.status(404).json({
                error: 'Perfil não encontrado.'
            });
        }

        res.json({
            usuario: usuarioData.user,
            perfil: perfil
        });

    } catch (erro) {

        console.error('Erro ao consultar perfil:', erro);

        res.status(500).json({
            error: 'Não foi possível consultar o perfil.'
        });
    }
});

// ==================================
// INTELIGÊNCIA ARTIFICIAL TONI AI
// ==================================

app.post('/api/chat', async (req, res) => {

    console.log('Nova mensagem recebida pela Toni AI 3.0!');

    try {

        const { messages } = req.body;

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({
                error: 'Chave da Groq não configurada no arquivo .env.'
            });
        }

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: 'Nenhuma mensagem foi enviada.'
            });
        }

        const historico = messages
            .filter(msg =>
                ['user', 'assistant'].includes(msg.role) &&
                typeof msg.content === 'string'
            )
            .slice(-30);

        const resposta = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                },

                body: JSON.stringify({

                    model: 'openai/gpt-oss-20b',

                    messages: [
                        {
                            role: 'system',

                            content: `Você é a Toni AI 3.0, uma inteligência artificial moderna, inteligente, amigável e versátil.

Suas características:

- Converse naturalmente em português do Brasil.
- Ajude com programação, tecnologia, estudos, matemática, criatividade e assuntos gerais.
- Explique assuntos difíceis de maneira simples e organizada.
- Ajude a criar sites, aplicativos, sistemas e projetos completos.
- Analise cuidadosamente o contexto das mensagens anteriores.
- Seja educada, paciente, criativa e objetiva.
- Quando fornecer códigos, entregue exemplos completos e explique onde colocá-los.
- Nunca invente informações quando não souber a resposta.
- Não diga que possui ferramentas ou recursos que ainda não foram implementados.

Seu nome é Toni AI 3.0.

Seu objetivo é ser uma assistente útil, inteligente e confiável para diferentes necessidades do usuário.`
                        },

                        ...historico
                    ],

                    temperature: 0.7,
                    max_completion_tokens: 2048
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {

            console.error('Erro da Groq:', dados);

            return res.status(resposta.status).json({
                error: dados.error?.message || 'Erro ao consultar a Groq.'
            });
        }

        const textoResposta = dados.choices?.[0]?.message?.content;

        if (!textoResposta) {
            return res.status(500).json({
                error: 'A Toni AI não retornou uma resposta válida.'
            });
        }

        res.json({
            resposta: textoResposta
        });

    } catch (erro) {

        console.error('Erro no servidor:', erro);

        res.status(500).json({
            error: 'Não foi possível conectar à inteligência artificial.'
        });
    }
});

// ==================================
// INICIALIZAÇÃO
// ==================================

const servidor = app.listen(PORT, () => {

    console.log('================================');
    console.log('       TONI AI 3.0 ONLINE!');
    console.log('================================');

    console.log(`http://localhost:${PORT}`);
});

servidor.on('error', (erro) => {
    console.error('ERRO AO INICIAR O SERVIDOR:', erro);
});
