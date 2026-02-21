interface Vacante {
  id_vacante:string;
  titulo: string;
  tipo_trabajo: string;
  modalidad: string;
  salario: number;
  ubicacion: string;
  empresa:Empresa;
  habilidades?: any[];
  idiomas?: any[]; 
}

interface VacanteHabilidades {
  id_vacante_habilidades: string;
}

interface CrearVacante{
  id_vacante:string;
  titulo: string;
  tipo_trabajo: string;
  tipo_modalidad: string;
  salario: number;
  ubicacion: string;
  empresa:Empresa;
  vacanteHabilidades?: any[];
  vacantesIdiomas?: any[];
}

interface CertificadoEmpresa {
  id_detalles_certificados: string;
  certificado: {
    //id_certificado: string;
    entidad_emisora: string;
    nombre_certificado: string;
  };
  fecha_emision: string;
  fecha_caducidad: string;
  /*id_certificado: string;
  id_empresa: string;  
  fechaEmision: string;
  fechaCaducidad: string;*/
  
}

interface CrearCertificadoEmpresa {
  certificado: {
    id_certificado: string;
  };
  empresa: {
    id: string;
  };
  fecha_emision: string;
  fecha_caducidad: string;
}

interface Certificado{
  id_certificado: string;
  entidad_emisora: string;
  nombre_certificado: string
}

interface PerfilEmpresaModel {
  descripcion: string;
  vacantes: Vacante[];
  certificados: CertificadoEmpresa[];
}
interface Empresa {
  id_perfil: string;
  name_empresa: string;
  ubicacion: string;
  descripcion: string;
  sector: string;
  NIT: string;
}
