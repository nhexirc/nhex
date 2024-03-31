const TOPIC_BAR = "border-x border-t w-full bg-zinc-900 p-1 focus:outline-none placeholder:font-bold placeholder-zinc-300";
export default function Topic({ topic }) {
    return (
        <div id="topic_bar" className={TOPIC_BAR}>
            {topic}
        </div>
    )
};
