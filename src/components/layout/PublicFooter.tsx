import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              <span className="font-display text-lg font-semibold">
                Apoio Factual
              </span>
            </div>
            <p className="text-sm text-primary-foreground/70">
              Serviço técnico de organização documental e apoio factual. 
              Não prestamos aconselhamento jurídico.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Links Úteis</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <a href="#servicos" className="hover:text-primary-foreground transition-colors">Serviços</a>
              </li>
              <li>
                <a href="#metodologia" className="hover:text-primary-foreground transition-colors">Metodologia</a>
              </li>
              <li>
                <a href="#condicoes" className="hover:text-primary-foreground transition-colors">Condições</a>
              </li>
              <li>
                <a href="#contacto" className="hover:text-primary-foreground transition-colors">Contacto</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Aviso Legal</h4>
            <p className="text-sm text-primary-foreground/70">
              Este serviço destina-se exclusivamente a organização documental 
              e apresentação factual. Não substitui aconselhamento jurídico 
              profissional.
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-primary-foreground/10 text-center text-sm text-primary-foreground/50">
          <p>© {new Date().getFullYear()} Apoio Factual e Organização Documental. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
