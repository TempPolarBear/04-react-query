import styles from './ErrorMessage.module.css';

export default function ErrorMessage() {
  return (
    <p className={styles.text} role="alert">
      There was an error, please try again...
    </p>
  );
}
