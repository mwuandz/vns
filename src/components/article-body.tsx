import { articleBlocks, videoEmbed, type Inline } from "@/lib/magazine";

function Marks({ inlines }: { inlines: Inline[] }) {
  return inlines.map((mark, index) => {
    if (mark.type === "bold") return <strong key={index}>{mark.text}</strong>;
    if (mark.type === "italic") return <em key={index}>{mark.text}</em>;
    if (mark.type === "strike") return <s key={index}>{mark.text}</s>;
    if (mark.type === "link") {
      return (
        <a key={index} href={mark.href} target="_blank" rel="noopener noreferrer">
          {mark.text}
        </a>
      );
    }
    return <span key={index}>{mark.text}</span>;
  });
}

export function ArticleBody({ body }: { body: string }) {
  const blocks = articleBlocks(body);
  return (
    <div className="story-body">
      {blocks.map((block, index) => {
        if (block.type === "hr") return <hr key={index} />;
        if (block.type === "image") {
          return (
            <figure key={index} className="inline-figure">
              <img src={block.src} alt={block.alt} />
              {block.alt ? <figcaption>{block.alt}</figcaption> : null}
            </figure>
          );
        }
        if (block.type === "video") {
          const embed = block.src.startsWith("/media/")
            ? { src: block.src, title: "file" }
            : videoEmbed(block.src);
          if (!embed) return null;
          if (embed.title === "file") {
            return (
              <figure key={index} className="inline-figure">
                <video src={embed.src} controls playsInline />
                {block.title && block.title !== "Video" ? <figcaption>{block.title}</figcaption> : null}
              </figure>
            );
          }
          return (
            <figure key={index} className="inline-figure story-video">
              <iframe
                src={embed.src}
                title={block.title || embed.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {block.title && block.title !== "Video" ? <figcaption>{block.title}</figcaption> : null}
            </figure>
          );
        }
        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Marks inlines={item} />
                </li>
              ))}
            </List>
          );
        }
        if (block.type === "h2") return <h2 key={index}><Marks inlines={block.inlines} /></h2>;
        if (block.type === "quote") {
          return (
            <blockquote key={index}>
              <Marks inlines={block.inlines} />
            </blockquote>
          );
        }
        return (
          <p key={index}>
            <Marks inlines={block.inlines} />
          </p>
        );
      })}
    </div>
  );
}
