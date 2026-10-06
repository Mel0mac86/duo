import { Modal } from '../components/Chrome'

export function OutOfHearts({ msLeft, hearts, canPractice, onPractice, onClose }: {
  msLeft: number; hearts: number; canPractice: boolean; onPractice: () => void; onClose: () => void
}) {
  const s = Math.ceil(msLeft / 1000)
  const time = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  return (
    <Modal label="Cuori esauriti">
      <div className="big-emoji" aria-hidden="true">💔</div>
      {hearts > 0 ? (
        <>
          <h2>Hai di nuovo {hearts} {hearts === 1 ? 'cuore' : 'cuori'}!</h2>
          <button className="btn block" onClick={onClose} autoFocus>Torna al percorso</button>
        </>
      ) : (
        <>
          <h2>Hai finito i cuori</h2>
          <p className="muted">Il prossimo cuore arriva tra <strong data-testid="refill">{time}</strong>. Ripassa per recuperarne uno subito.</p>
          {canPractice && <button className="btn block" onClick={onPractice} autoFocus>Ripassa (+1 ❤️)</button>}
          <button className="btn ghost block" onClick={onClose}>Più tardi</button>
        </>
      )}
    </Modal>
  )
}
