import React, { useState } from 'react';
import { Heart, Star, MapPin, Clock, ArrowRight, X } from 'lucide-react';

interface Professional {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  image: string;
  rating: number;
  services: string[];
  color: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  image: string;
}

interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  service: string;
}

const PortfolioPage: React.FC = () => {
  const [showBooking, setShowBooking] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);

  const professionals: Professional[] = [
    {
      id: '1',
      name: 'Elisangela',
      specialty: 'Maquiagem Profissional & Estética',
      bio: 'Especialista em make artística e design de sobrancelha com mais de 15 anos de experiência. Criadora do estilo LEV.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      rating: 5,
      services: ['Maquiagem Artística', 'Design de Sobrancelha', 'Tratamento de Pele', 'Blindagem de Cílios'],
      color: 'from-rose-500 to-pink-500'
    },
    {
      id: '2',
      name: 'Talitha',
      specialty: 'Alongamento & Manicure Premium',
      bio: 'Especialista em unhas e alongamento. Domina técnicas internacionais de nail art e design exclusivo.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      rating: 5,
      services: ['Alongamento Gel', 'Manicure Premium', 'Nail Art', 'Decoração de Unhas'],
      color: 'from-purple-500 to-indigo-500'
    },
    {
      id: '3',
      name: 'Nayara',
      specialty: 'Penteados & Tratamento Capilar',
      bio: 'Especialista em penteados sofisticados e cuidados capilares. Cria looks memoráveis para cada ocasião.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      rating: 5,
      services: ['Penteados Sofisticados', 'Hidratação Capilar', 'Coloração Premium', 'Tratamento Botox'],
      color: 'from-amber-500 to-orange-500'
    }
  ];

  const services: Service[] = [
    {
      id: '1',
      name: 'Maquiagem Artística',
      description: 'Maquiagem profissional para eventos, casamentos e sessões fotográficas',
      price: 'A partir de R$ 150',
      duration: '45-60 min',
      image: 'https://images.unsplash.com/photo-1560322175-98d79277a7e5?w=500&h=400&fit=crop'
    },
    {
      id: '2',
      name: 'Alongamento de Cílios',
      description: 'Técnica de blindagem com cílios premium e aplicação profissional',
      price: 'A partir de R$ 120',
      duration: '60 min',
      image: 'https://images.unsplash.com/photo-1487412947fa58e98b98e15c80beeb2eb?w=500&h=400&fit=crop'
    },
    {
      id: '3',
      name: 'Alongamento de Unhas',
      description: 'Gel ou acrílico premium com design exclusivo e acabamento perfeito',
      price: 'A partir de R$ 100',
      duration: '60 min',
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&h=400&fit=crop'
    },
    {
      id: '4',
      name: 'Design de Sobrancelha',
      description: 'Estudos de proporção e design personalizado com henna ou pigmento',
      price: 'A partir de R$ 80',
      duration: '30-45 min',
      image: 'https://images.unsplash.com/photo-1552763949-a5fb8d695c68?w=500&h=400&fit=crop'
    },
    {
      id: '5',
      name: 'Penteado Sofisticado',
      description: 'Penteados para casamentos, formaturas e eventos especiais',
      price: 'A partir de R$ 120',
      duration: '45-60 min',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=400&fit=crop'
    },
    {
      id: '6',
      name: 'Tratamento de Pele',
      description: 'Limpeza profunda, hidratação intensiva e rejuvenescimento facial',
      price: 'A partir de R$ 150',
      duration: '60 min',
      image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&h=400&fit=crop'
    }
  ];

  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Marina Silva',
      text: 'Melhor experiência de beleza que já tive! Elisangela é uma artista. Saí de lá me sentindo uma nova pessoa.',
      rating: 5,
      service: 'Maquiagem + Design de Sobrancelha'
    },
    {
      id: '2',
      name: 'Juliana Costa',
      text: 'Meu casamento foi perfeito! Talitha fez minhas unhas e o penteado com Nayara. Tudo impecável!',
      rating: 5,
      service: 'Pacote Noiva'
    },
    {
      id: '3',
      name: 'Patrícia Oliveira',
      text: 'Studio profissional, acessível e com um atendimento excepcional. Recomendo muito!',
      rating: 5,
      service: 'Alongamento de Cílios'
    },
    {
      id: '4',
      name: 'Carolina Ferreira',
      text: 'O espaço é lindo, limpo e as profissionais são muito competentes. Voltarei sempre!',
      rating: 5,
      service: 'Múltiplos Serviços'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-gray-900">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-rose-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center max-w-4xl px-6">
          <div className="mb-6 flex justify-center">
            <span className="text-rose-400 font-semibold text-lg tracking-widest uppercase">Beleza Premium</span>
          </div>
          <h1 className="text-7xl md:text-8xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400">
            LEV Coworking Beauty
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 font-light">
            Onde arte, elegância e beleza se encontram em um espaço premium
          </p>
          <button
            onClick={() => setShowBooking(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-2xl hover:shadow-rose-500/50 transition-all duration-300 text-lg"
          >
            Agendar Agora <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Profissionais Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-4">Nossas Profissionais</h2>
          <p className="text-xl text-gray-400">Especialistas apaixonadas pelo que fazem</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {professionals.map((prof) => (
            <div
              key={prof.id}
              className="group cursor-pointer"
              onClick={() => {
                setSelectedProfessional(prof.id);
                setShowBooking(true);
              }}
            >
              <div className={`relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br ${prof.color} p-1`}>
                <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-square">
                  <img
                    src={prof.image}
                    alt={prof.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-1">
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  <span className="font-bold text-gray-900">{prof.rating}</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{prof.name}</h3>
              <p className="text-rose-400 font-semibold mb-3">{prof.specialty}</p>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">{prof.bio}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {prof.services.slice(0, 2).map((service, idx) => (
                  <span key={idx} className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                    {service}
                  </span>
                ))}
              </div>
              <button className="text-rose-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                Agendar <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Serviços Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-4">Nossos Serviços</h2>
          <p className="text-xl text-gray-400">Experiências premium de beleza</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className="group cursor-pointer bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden hover:from-gray-700 hover:to-gray-800 transition-all duration-300"
              onClick={() => setShowBooking(true)}
            >
              <div className="h-64 overflow-hidden relative">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{service.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span className="flex items-center gap-2">
                    <Clock size={16} /> {service.duration}
                  </span>
                  <span className="text-rose-400 font-semibold">{service.price}</span>
                </div>
                <button className="w-full py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-rose-500/50 transition-all duration-300">
                  Agendar Agora
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Depoimentos Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-4">O Que Dizem Nossos Clientes</h2>
          <p className="text-xl text-gray-400">Histórias de satisfação e confiança</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Heart key={i} size={18} className="fill-rose-400 text-rose-400" />
                ))}
              </div>
              <p className="text-gray-300 mb-6 text-lg italic leading-relaxed">"{testimonial.text}"</p>
              <div>
                <p className="text-white font-bold">{testimonial.name}</p>
                <p className="text-rose-400 text-sm">{testimonial.service}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contato Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/50 rounded-2xl p-12 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Pronto para se Transformar?</h2>
          <p className="text-xl text-gray-300 mb-8">Agende sua experiência premium hoje mesmo</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setShowBooking(true)}
              className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-2xl hover:shadow-rose-500/50 transition-all duration-300"
            >
              Agendar Agora
            </button>
            <a
              href="https://wa.me/554198497994"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border-2 border-rose-400 text-rose-400 font-semibold rounded-lg hover:bg-rose-400/10 transition-all duration-300 flex items-center gap-2"
            >
              <MapPin size={20} /> Fale Conosco
            </a>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-800 relative">
            <button
              onClick={() => {
                setShowBooking(false);
                setSelectedProfessional(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="p-8">
              <h3 className="text-3xl font-bold text-white mb-6">Agendar Serviço</h3>

              {selectedProfessional && (
                <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400">Profissional selecionada:</p>
                  <p className="text-lg font-bold text-rose-400">
                    {professionals.find((p) => p.id === selectedProfessional)?.name}
                  </p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Seu nome"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-rose-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Seu email"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-rose-500 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="WhatsApp"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-rose-500 focus:outline-none"
                />
                <select className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-rose-500 focus:outline-none">
                  <option>Selecione um serviço</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <button className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-2xl hover:shadow-rose-500/50 transition-all duration-300 mb-3">
                Agendar
              </button>
              <p className="text-center text-sm text-gray-400">
                Você será redirecionado para o WhatsApp para confirmar
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
