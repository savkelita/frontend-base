/* eslint-disable react/jsx-no-literals -- Текст овде намерно не иде кроз `t()`: писмо се
   бира у конфигурацији које управо нема, па стоји исписан оба писма. */

// -------------------------------------------------------------------------------------
// Екран за неисправну конфигурацију
// -------------------------------------------------------------------------------------
//
// Намерно без Fluent-а и без иједног текста кроз `t()`: ово се исцртава пре него што је
// апликација уопште подигнута, па не сме да зависи ни од чега што би и само могло да
// откаже. Текст стоји оба писма, јер избор писма стиже баш из конфигурације које нема.

export const GreskaKonfiguracije = ({ poruka }: { readonly poruka: string }) => (
  <div
    style={{
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      maxWidth: 640,
      margin: '80px auto',
      padding: 24,
      border: '1px solid #d13438',
      borderRadius: 4,
      color: '#201f1e',
    }}
  >
    <h1 style={{ fontSize: 20, margin: '0 0 12px', color: '#a4262c' }}>
      Апликација није подигнута / Aplikacija nije podignuta
    </h1>
    <p style={{ margin: '0 0 12px' }}>{poruka}</p>
    <p style={{ margin: 0, fontSize: 13, color: '#605e5c' }}>
      Проверите да ли <code>config.json</code> стоји поред <code>index.html</code> и да ли садржи <code>basePath</code>,{' '}
      <code>apiUrl</code>, <code>pismo</code> и <code>environment</code>.
    </p>
  </div>
)
