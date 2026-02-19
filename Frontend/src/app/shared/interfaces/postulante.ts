interface CV {
  experiencia: string;
  curriculum: string;
}

interface Estudio {
  titulo: string;
  nivel: string;
  certificado: string;
}

interface Habilidad {
  id_habilidad: string;
  nombre_habilidad:string;
}
interface Idioma {
  id_habilidad: string;
  nombre_habilidad:string;
}

interface Idioma {
  id_idioma: string;
  nombre: string;
}

interface PerfilPostulanteModel {
  id_perfil?: string;
  name: string;
  lastname: string;
}

interface Postulante{
  id:string;
  name:string;
  lastname:string;
  anos_experiencia:number;
  curriculum:string;
  foto:string;
  ubicacion:string;
  habilidades?: any[];
  idiomas?: any[];
}
