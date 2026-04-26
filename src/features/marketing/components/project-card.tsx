import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    username: string;
    logoUrl: string | null;
    mainColorLight: string | null;
    mainColorDark: string | null;
    tags: string[];
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const coverColor = project.mainColorLight ?? project.mainColorDark ?? "#35a85a";

  return (
    <Link
      href={`/${project.username}/${project.slug}`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden hover:border-white/20 hover:bg-white/10 transition-all duration-200"
    >
      <div
        className="h-28 flex items-center justify-center"
        style={{ backgroundColor: coverColor }}
      >
        {project.logoUrl ? (
          <Image
            src={project.logoUrl}
            alt={project.name}
            width={56}
            height={56}
            className="size-14 rounded-xl object-contain drop-shadow-md"
          />
        ) : (
          <span className="text-3xl font-bold text-white/80">
            {project.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[15px] text-white leading-tight group-hover:text-white/90">
            {project.name}
          </h3>
          <ArrowRightIcon className="size-3.5 text-white/30 shrink-0 mt-0.5 group-hover:text-white/60 transition-colors" />
        </div>

        {project.description && (
          <p className="text-[13px] text-white/50 leading-relaxed line-clamp-2">
            {project.description}
          </p>
        )}

        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
