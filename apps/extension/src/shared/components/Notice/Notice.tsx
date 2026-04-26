interface NoticeProps {
    type: 'status' | 'note';
    text: string;
}

export function Notice({ text, type }: NoticeProps) {
    return (
        <div className="flowforge-notice" role={type}>
            <p className="flowforge-notice__text">{text}</p>
        </div>
    );
}
