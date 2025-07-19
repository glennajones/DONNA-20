import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Eye, Send, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { FormTemplate } from "@shared/schema";

interface FormTemplateItemProps {
  template: FormTemplate;
  onPreview: (template: FormTemplate) => void;
  onSend?: (template: FormTemplate) => void;
  onDelete: (template: FormTemplate) => void;
  isDeleting: boolean;
}

export function FormTemplateItem({ template, onPreview, onSend, onDelete, isDeleting }: FormTemplateItemProps) {
  const { user } = useAuth();

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold">{template.name}</h3>
            <Badge variant="outline" className="text-xs">
              {template.fields.length} field{template.fields.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          {template.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {template.description}
            </p>
          )}
          <div className="text-xs text-gray-500">
            Created {new Date(template.createdAt).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPreview(template)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {onSend && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSend(template)}
              className="text-[#56A0D3] hover:text-[#4A90C2]"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "manager") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(template)}
              className="text-red-500 hover:text-red-700"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <Separator className="my-3" />
      
      <div className="flex flex-wrap gap-2">
        {template.fields.map((field: any, index: number) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {field.label} ({field.type})
          </Badge>
        ))}
      </div>
    </div>
  );
}