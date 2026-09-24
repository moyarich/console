import type { ComponentPropsWithoutRef } from "react";

export function MdxTable(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="mdx-table-scroll" tabIndex={0}>
      <table {...props} />
    </div>
  );
}
