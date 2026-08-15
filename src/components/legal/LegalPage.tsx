import React from 'react';
import { Logo } from '../brand/Logo';

type LegalPageKind = 'privacy' | 'data-deletion';

interface LegalPageProps {
  kind: LegalPageKind;
}

const contactEmail = 'ricllucas@hotmail.com';

const Section: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="font-serif text-xl text-[#d4c39f]">{title}</h2>
    <div className="space-y-3 text-sm leading-7 text-white/75 sm:text-base">{children}</div>
  </section>
);

const PrivacyPolicy = () => (
  <>
    <header className="space-y-3 border-b border-white/10 pb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c4b491]">Privacidade e proteção de dados</p>
      <h1 className="font-serif text-3xl text-white sm:text-4xl">Política de Privacidade</h1>
      <p className="text-sm text-white/55">Última atualização: 15 de agosto de 2026</p>
    </header>

    <Section title="1. Quem somos">
      <p>O LEV Coworking Beauty oferece uma plataforma de agendamento que conecta clientes às profissionais que atendem no espaço LEV.</p>
    </Section>

    <Section title="2. Dados que podemos coletar">
      <p>Para realizar e administrar agendamentos, podemos coletar nome, telefone, e-mail opcional, serviço escolhido, profissional, data, horário e observações fornecidas pela própria cliente.</p>
      <p>Também podemos registrar informações técnicas estritamente necessárias à segurança e ao funcionamento da plataforma, como data e horário de acesso e registros de operação.</p>
    </Section>

    <Section title="3. Como usamos os dados">
      <p>Utilizamos os dados para confirmar, alterar ou cancelar agendamentos; permitir o atendimento pela profissional escolhida; evitar conflitos de horário; prestar suporte; manter a segurança; e cumprir obrigações legais.</p>
      <p>Não comercializamos dados pessoais.</p>
    </Section>

    <Section title="4. Compartilhamento e operadores">
      <p>Os dados de um agendamento podem ser disponibilizados à profissional responsável e a prestadores necessários à operação, como hospedagem, banco de dados, Google Agenda e canais oficiais de comunicação. Cada prestador recebe apenas as informações necessárias à sua finalidade.</p>
    </Section>

    <Section title="5. Conservação e segurança">
      <p>Mantemos os dados pelo tempo necessário para prestar o serviço, resguardar direitos e cumprir obrigações legais. Adotamos medidas razoáveis de segurança e restringimos o acesso aos ambientes administrativos e profissionais.</p>
    </Section>

    <Section title="6. Direitos da titular">
      <p>Nos termos da LGPD, você pode solicitar confirmação do tratamento, acesso, correção, anonimização, portabilidade quando aplicável, informação sobre compartilhamentos e exclusão dos dados tratados com base no consentimento, ressalvadas as hipóteses legais de conservação.</p>
    </Section>

    <Section title="7. Contato">
      <p>Para dúvidas ou solicitações sobre dados pessoais, envie um e-mail para <a className="text-[#d4c39f] underline underline-offset-4" href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>
      <p>Consulte também as <a className="text-[#d4c39f] underline underline-offset-4" href="/exclusao-de-dados">instruções para exclusão de dados</a>.</p>
    </Section>
  </>
);

const DataDeletion = () => (
  <>
    <header className="space-y-3 border-b border-white/10 pb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c4b491]">Controle dos seus dados</p>
      <h1 className="font-serif text-3xl text-white sm:text-4xl">Exclusão de Dados do Usuário</h1>
      <p className="text-sm text-white/55">Instruções para solicitar a remoção de informações pessoais</p>
    </header>

    <Section title="Como solicitar">
      <ol className="list-decimal space-y-2 pl-5">
        <li>Envie um e-mail para <a className="text-[#d4c39f] underline underline-offset-4" href={`mailto:${contactEmail}?subject=Solicitação de exclusão de dados`}>{contactEmail}</a> com o assunto “Solicitação de exclusão de dados”.</li>
        <li>Informe o nome e o telefone usados no agendamento.</li>
        <li>Descreva quais dados ou agendamentos deseja excluir.</li>
      </ol>
    </Section>

    <Section title="Validação e prazo">
      <p>Para proteger a titular, poderemos solicitar uma confirmação de identidade pelo canal de contato informado no agendamento. Após a validação, responderemos à solicitação e informaremos as providências adotadas em até 15 dias.</p>
    </Section>

    <Section title="Dados que podem ser preservados">
      <p>Algumas informações poderão ser mantidas quando necessárias ao cumprimento de obrigação legal, exercício regular de direitos, prevenção a fraudes ou outra hipótese autorizada pela LGPD. Nesses casos, informaremos o motivo da conservação.</p>
    </Section>

    <Section title="Outras solicitações">
      <p>O mesmo canal pode ser usado para solicitar acesso ou correção de dados. Para mais informações, consulte nossa <a className="text-[#d4c39f] underline underline-offset-4" href="/politica-de-privacidade">Política de Privacidade</a>.</p>
    </Section>
  </>
);

export const LegalPage: React.FC<LegalPageProps> = ({ kind }) => (
  <div className="min-h-screen bg-[#050505] text-white">
    <header className="border-b border-white/10 bg-[#080808]">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="/" aria-label="Voltar para a página inicial">
          <Logo size="sm" />
        </a>
        <a className="text-sm text-white/60 transition hover:text-[#d4c39f]" href="/">Voltar ao site</a>
      </div>
    </header>
    <main className="mx-auto max-w-4xl space-y-10 px-5 py-12 sm:px-8 sm:py-16">
      {kind === 'privacy' ? <PrivacyPolicy /> : <DataDeletion />}
    </main>
    <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-white/45">
      © {new Date().getFullYear()} LEV Coworking Beauty
    </footer>
  </div>
);


