# Elo Acessível — piloto 0.1

Legendas compartilhadas para escolas, igrejas e eventos. Nome provisório, ainda sem pesquisa de marca. Este repositório contém uma base funcional de avaliação, não uma versão comercial homologada.

## Começar no Windows

1. Instale Node.js 22 ou superior.
2. No GitHub, escolha **Code → Download ZIP** e extraia a pasta completa.
3. Abra `Iniciar-Windows.cmd` e mantenha a janela aberta.
4. Acesse **http://localhost:8080**. Copie a chave do organizador exibida no terminal para o formulário.
5. Crie uma sessão. Envie um texto manual e abra **Compartilhar sessão → Abrir telão** para testar.
6. Para experimentar a transcrição, leia o aviso de processamento de áudio, marque a opção, clique em **Iniciar microfone** e permita o acesso no navegador.

Não há dependências externas a instalar. Alternativamente: `npm start`. Verificação do servidor: `npm test`.

## O que funciona

- Criação de sessões protegida por chave de organizador.
- Link de leitura separado da chave de controle, com atualização a cada aproximadamente 1,2 segundo.
- Envio manual de legendas e descrições visuais; histórico limitado às últimas 100 legendas.
- Transcrição experimental em português pelo reconhecimento de fala do navegador.
- Modo telão, saída por Esc, três tamanhos de letra, alto contraste e navegação com teclado.
- Anúncio opcional das legendas por leitor de tela e leitura sob demanda pela síntese de voz do dispositivo.
- Limpeza e encerramento da sessão; recuperação do painel na mesma aba após atualizar a página.

## Celular e rede local

Por padrão, o servidor aceita conexões apenas do próprio computador. Para um teste autorizado na mesma rede, abra PowerShell na pasta do projeto:

```powershell
$env:HOST="0.0.0.0"
npm start
```

Libere a porta TCP 8080 no firewall somente para a rede privada de teste. Descubra o IPv4 do computador com `ipconfig`. Abra o painel em `http://IP-DO-COMPUTADOR:8080` e crie a sessão nesse endereço para gerar o link correto para os celulares. Todos devem estar na mesma rede e ela deve permitir comunicação entre dispositivos. Não exponha a porta diretamente à internet.

Reconhecimento de fala geralmente precisa de contexto seguro (HTTPS ou localhost); o painel acessado pelo IP via HTTP pode apenas enviar texto manualmente. Para transcrever no computador com localhost e acompanhar pelo celular, substitua SOMENTE `localhost` no link do público pelo IP do computador, mantendo porta e fragmento completos. Um serviço hospedado exige HTTPS e arquitetura de produção.

## Privacidade e limites

As legendas são guardadas apenas na memória do servidor. Encerrar ou limpar remove seu texto; reiniciar perde todas as sessões. Cada sessão expira quatro horas após a criação; a limpeza de sessões expiradas acontece na próxima solicitação à API. Não são gravados arquivos de áudio pelo aplicativo. Isso não significa processamento de áudio local: o reconhecimento do navegador pode enviar áudio ao serviço de seu fornecedor e depender de internet. Informe os participantes e não use conteúdo sensível nos primeiros testes.

Quem possuir o link do público poderá ler a sessão. Compartilhe-o com cuidado. A chave de organizador gerada é temporária e aparece somente no terminal; uma chave fixa pode ser definida pela variável `ADMIN_KEY`, sem colocá-la no Git. O controle individual da sessão fica em `sessionStorage` da aba.

Há limite de 50 sessões por processo, 100 legendas por sessão e 2.000 caracteres por legenda. O protótipo opera em um único processo, sem banco, contas de empresas, cobrança, recuperação de desastres ou garantia de disponibilidade. Falhas de rede são informadas, mas legendas cujo envio falhe precisam ser reenviadas manualmente. O navegador pode encerrar a captura: a interface informa e pede reinício. Não há promessa de transcrição contínua ou offline.

## Antes de vender

1. Testar em ambiente real com pessoas cegas, com baixa visão, surdas e com deficiência auditiva; incluir usuários de Libras.
2. Validar teclado, TalkBack, VoiceOver, NVDA, zoom, contraste, legibilidade, ruído e precisão da transcrição.
3. Definir fornecedor de transcrição, custos, política de dados e consentimento apropriado; medir duração e erros.
4. Implementar contas institucionais, permissões, separação de clientes, limites por plano, auditoria sem conteúdo sensível e operação com HTTPS.
5. Avaliar privacidade, atendimento de menores e requisitos contratuais com profissionais competentes. Não declarar conformidade com acessibilidade ou legislação sem avaliação.
6. Validar preço e disposição de compra com instituições piloto. Acesso gratuito ao participante; proposta comercial de assinatura institucional ainda a definir.

Este recurso não substitui intérprete de Libras, audiodescrição humana ou outros apoios. A leitura por voz reproduz o texto recebido; ela não descreve imagens automaticamente.

## Estrutura e validação

`server.mjs`: servidor HTTP e sessões temporárias. `public/`: interface responsiva em HTML, CSS e JavaScript. `test/`: testes de integração com Node Test Runner. `Iniciar-Windows.cmd`: inicialização no Windows.

O teste automatizado cobre autorização, isolamento entre sessões, validação, envio, limpeza, encerramento, expiração e restrição de arquivos. Testes de microfone real, renderização em dispositivos e leitores de tela precisam ser realizados antes do piloto com público.

Referência da API experimental: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

Código de projeto comercial; nenhuma licença de redistribuição foi concedida neste repositório. A visibilidade pública do repositório deve ser reavaliada pelo proprietário antes de incluir materiais comerciais reservados.

## Módulo Comunicar

Abra **Comunicar** no topo da página ou acesse `/comunicar`. O módulo abre em outra aba para manter a sessão de legendas disponível. Não exige chave, conta ou sessão.

- Escreva ou escolha uma frase pronta; nada é falado automaticamente.
- Use **Falar mensagem**, **Parar voz** ou **Mostrar em letras grandes**. Esc ou o botão de voltar fecham a mensagem ampliada.
- Ajuste contraste, tamanho do texto, velocidade e voz em português, quando disponível no dispositivo.
- Salve até 12 frases personalizadas, exclusivamente neste navegador, por ação explícita. Em equipamento compartilhado use **Apagar minhas frases**. O texto digitado não é persistido nem enviado ao servidor do aplicativo. A síntese de voz pode depender de serviço online conforme a voz do dispositivo.

Este módulo é uma prancha textual inicial para quem não utiliza fala oral ou tem dificuldade de fala; ainda não inclui pictogramas, varredura por acionador, integração remota das respostas ou avaliação individual de comunicação alternativa. A reprodução de voz e o comportamento com leitores de tela ainda requerem teste nos dispositivos reais.
