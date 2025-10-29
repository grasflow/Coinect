import QueryProvider from "@/components/QueryProvider";
import GlobalWidgets from "@/components/GlobalWidgets";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <QueryProvider>
      {children}
      <GlobalWidgets />
    </QueryProvider>
  );
}
