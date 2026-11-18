import ReactMarkdown from 'react-markdown';

// react-markdown no interpreta HTML crudo, así que el contenido se renderiza sin riesgo de XSS.
// Los links se abren en pestaña nueva y solo se permiten http(s) y mailto.
const componentes = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

export default function Markdown({ children, className }) {
  return (
    <div className={className}>
      <ReactMarkdown components={componentes}>{children ?? ''}</ReactMarkdown>
    </div>
  );
}
