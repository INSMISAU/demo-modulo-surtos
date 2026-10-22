MÓDULO FORMATIVO — ESTADO DOS CARTÕES — 23/10/2026
Estado: correcção preparada e testada localmente; ainda por publicar pela utilizadora.
Base: 36195170fecee4b02b2a9d7a9b5d04f4ed65f255
Repositório: INSMISAU/demo-modulo-surtos

PROBLEMA CONFIRMADO
O cartão podia mostrar «Por iniciar» após uma avaliação já submetida, porque a indicação dependia apenas dos tópicos de leitura concluídos. O mesmo acontecia ao iniciar leitura sem concluir o primeiro tópico e em tentativas interrompidas. A nota estava preservada; a indicação de estado não reflectia toda a actividade.

CORRECÇÃO
- Considerar leitura iniciada ou parcial, tópicos concluídos, notas (incluindo 0%), avaliações submetidas, tentativas em curso, alternativas e tentativas arquivadas.
- Mostrar «Em curso» quando existe actividade sem aprovação.
- Mostrar «Continuar módulo» quando o percurso desse módulo já começou.
- Manter «Por iniciar» e «Abrir módulo» num módulo sem actividade.
- Manter «Avaliação aprovada» quando a nota é igual ou superior a 80% e ainda há leitura por concluir.
- Manter «Módulo concluído» quando a leitura e a aprovação estão concluídas.
- Manter a ligação «Retomar avaliação» para tentativas em curso.
- Actualizar apenas a versão da cache para disponibilizar o JavaScript corrigido.

PRESERVADO
Sem alteração de conteúdos, imagens, gabaritos, cálculo de notas, duração das avaliações, leitura, regras de acesso, sincronização ou estrutura dos dados. A apresentação dos cartões não altera o percurso guardado. Sem alteração de base de dados, CMS, eBook ou Academia.

VERIFICAÇÃO DESTA CORRECÇÃO
14 cenários em cada um dos três módulos: 42 verificações de apresentação, ligação de retoma, manutenção da nota e igualdade dos dados guardados antes/depois da apresentação. Todos passaram após a correcção. A execução sobre a versão anterior reproduziu a indicação incorrecta nos casos afectados.
A sintaxe de formacao.js e sw.js foi verificada. Os ficheiros de base foram conferidos pelo hash Git contra o commit de origem. A lista de cache manteve-se igual.
Estes testes executaram a geração real da página inicial num ambiente isolado com dados de teste. Não constituem novo ensaio em telefone físico ou validação da versão ainda por publicar.

HISTÓRICO PRESERVADO
O histórico de 22/10/2026 permanece intacto. Este registo acrescenta apenas a correcção dos cartões. O pacote entregue inclui os dois ficheiros anteriores completos e o código de conteúdo usado como referência nos testes, juntamente com os resultados antes/depois e as diferenças.

PENDÊNCIAS QUE ESTE AJUSTE NÃO RESOLVE
- Imagens pouco nítidas do Módulo 1: o registo de 22/10 confirma que correspondem aos ficheiros do documento original; continuam necessários originais com melhor qualidade. Nenhuma imagem foi redesenhada, gerada ou substituída.
- Confirmar com a equipa a recuperação efectiva entre telemóvel e laptop, usando a mesma chave pessoal e após sincronização.
