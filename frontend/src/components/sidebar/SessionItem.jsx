import { motion } from "framer-motion";
import { MessagesSquare, Pencil, Trash2, Check, X } from "lucide-react";

export default function SessionItem({
  session,
  active,
  isEditing,
  editValue,
  onEditChange,
  onStartEdit,
  onSubmitEdit,
  onCancelEdit,
  onDelete,
  onSelect,
  index,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className={`group rounded-md px-2 py-2 mb-0.5 cursor-pointer transition-colors flex items-center gap-2 ${
        active
          ? "bg-[hsl(240_4%_14%)] text-white"
          : "hover:bg-[hsl(240_4%_11%)] text-zinc-400"
      }`}
      onClick={() => !isEditing && onSelect(session.id)}
      data-testid={`session-item-${session.id}`}
    >
      <MessagesSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
      {isEditing ? (
        <EditMode
          value={editValue}
          onChange={onEditChange}
          onSubmit={() => onSubmitEdit(session.id)}
          onCancel={onCancelEdit}
          testId={session.id}
        />
      ) : (
        <ViewMode
          title={session.title}
          onRename={() => onStartEdit(session)}
          onDelete={() => onDelete(session.id)}
          testId={session.id}
        />
      )}
    </motion.div>
  );
}

function EditMode({ value, onChange, onSubmit, onCancel, testId }) {
  return (
    <div className="flex items-center gap-1 flex-1">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
        className="bg-transparent text-sm text-white outline-none border-b border-zinc-600 flex-1 min-w-0"
        data-testid={`rename-input-${testId}`}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSubmit();
        }}
        className="text-zinc-400 hover:text-white"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
        className="text-zinc-400 hover:text-white"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ViewMode({ title, onRename, onDelete, testId }) {
  return (
    <>
      <span className="text-sm truncate flex-1">{title || "Untitled"}</span>
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          className="p-1 rounded hover:bg-[hsl(240_4%_18%)]"
          data-testid={`rename-btn-${testId}`}
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-[hsl(240_4%_18%)] hover:text-red-400"
          data-testid={`delete-session-btn-${testId}`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </>
  );
}
