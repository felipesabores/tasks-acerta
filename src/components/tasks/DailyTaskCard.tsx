import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CriticalityBadge } from './CriticalityBadge';
import { Task } from '@/hooks/useTasks';
import { CompletionStatus, DailyTaskCompletion } from '@/hooks/useDailyTasks';
import { 
  Eye, 
  Info, 
  Star,
  Lock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyTaskCardProps {
  task: Task;
  completion?: DailyTaskCompletion;
  selectedStatus: CompletionStatus | null;
  onStatusChange: (taskId: string, status: CompletionStatus) => void;
  onFinalize?: (taskId: string, status: CompletionStatus) => Promise<void>;
  disabled?: boolean;
}

export function DailyTaskCard({
  task,
  completion,
  selectedStatus,
  onStatusChange,
  onFinalize,
  disabled = false,
}: DailyTaskCardProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  
  const currentStatus = completion?.status || selectedStatus;
  const isSubmitted = !!completion;

  const handleFinalize = async () => {
    if (!selectedStatus || !onFinalize) return;
    setFinalizing(true);
    await onFinalize(task.id, selectedStatus);
    setFinalizing(false);
  };

  const getStatusIcon = (status: CompletionStatus | null) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'not_completed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'no_demand':
        return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "transition-all duration-200",
          isSubmitted && "opacity-60 bg-muted/50",
          currentStatus === 'completed' && "border-primary/30",
          currentStatus === 'not_completed' && "border-destructive/30"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold truncate",
                isSubmitted && "text-muted-foreground"
              )}>
                {task.title}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {task.points > 0 && (
                <div className="flex items-center gap-1 text-primary mr-2">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-semibold text-sm">{task.points}</span>
                </div>
              )}
              
              {task.is_mandatory && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-1">
                      <Lock className="h-4 w-4 text-destructive" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-sm">Tarefa obrigatória</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Eye icon - shows description tooltip */}
              {task.description && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[300px]">
                    <p className="text-sm">{task.description}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Info button - opens modal for review/change */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setReviewOpen(true)}
              >
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <CriticalityBadge criticality={task.criticality} />
            {currentStatus && getStatusIcon(currentStatus)}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <RadioGroup
            value={currentStatus || ''}
            onValueChange={(value) => onStatusChange(task.id, value as CompletionStatus)}
            disabled={disabled || isSubmitted}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="completed" 
                id={`completed-${task.id}`}
                className="border-primary data-[state=checked]:bg-primary"
              />
              <Label 
                htmlFor={`completed-${task.id}`}
                className={cn(
                  "text-sm cursor-pointer",
                  currentStatus === 'completed' && "text-primary font-medium"
                )}
              >
                Concluída
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="not_completed" 
                id={`not_completed-${task.id}`}
                className="border-destructive data-[state=checked]:bg-destructive"
              />
              <Label 
                htmlFor={`not_completed-${task.id}`}
                className={cn(
                  "text-sm cursor-pointer",
                  currentStatus === 'not_completed' && "text-destructive font-medium"
                )}
              >
                Não concluída
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="no_demand" 
                id={`no_demand-${task.id}`}
                className="border-muted-foreground data-[state=checked]:bg-muted-foreground"
              />
              <Label 
                htmlFor={`no_demand-${task.id}`}
                className={cn(
                  "text-sm cursor-pointer",
                  currentStatus === 'no_demand' && "text-muted-foreground font-medium"
                )}
              >
                Sem demanda no dia
              </Label>
            </div>
          </RadioGroup>

          {/* Finalize button - only shown when not submitted and has a status selected */}
          {!isSubmitted && onFinalize && (
            <Button
              onClick={handleFinalize}
              disabled={!selectedStatus || finalizing}
              className="w-full"
              size="sm"
            >
              {finalizing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Finalizar
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Revisar Tarefa
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{task.title}</h3>
              {task.is_mandatory && (
                <div className="flex items-center gap-1 text-destructive text-sm mt-1">
                  <Lock className="h-4 w-4" />
                  <span>Tarefa obrigatória</span>
                </div>
              )}
            </div>
            
            {task.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h4>
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <CriticalityBadge criticality={task.criticality} />
              {task.points > 0 && (
                <div className="flex items-center gap-1 text-primary">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-semibold">{task.points} pontos</span>
                </div>
              )}
            </div>
            
            {completion && (
              <div className="p-3 rounded-lg bg-muted">
                <h4 className="text-sm font-medium mb-1">Status de hoje</h4>
                <div className="flex items-center gap-2">
                  {getStatusIcon(completion.status)}
                  <span className="text-sm">
                    {completion.status === 'completed' && 'Concluída'}
                    {completion.status === 'not_completed' && 'Não concluída'}
                    {completion.status === 'no_demand' && 'Sem demanda no dia'}
                  </span>
                  {completion.points_earned !== 0 && (
                    <span className={cn(
                      "text-sm font-medium",
                      completion.points_earned > 0 ? "text-primary" : "text-destructive"
                    )}>
                      ({completion.points_earned > 0 ? '+' : ''}{completion.points_earned} pts)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
