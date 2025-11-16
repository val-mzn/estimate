import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { useSocket } from '../hooks/useSocket';
import { useRoomStore } from '../stores/roomStore';
import { useTaskDetailsStore } from '../stores/taskDetailsStore';
import { useRoomNavigation } from '../hooks/useRoomNavigation';
import { useEstimateCalculations } from '../hooks/useEstimateCalculations';
import { useTaskHandlers } from '../hooks/useTaskHandlers';
import { useTaskSelection } from '../hooks/useTaskSelection';
import { useAutoFinalEstimate } from '../hooks/useAutoFinalEstimate';
import { socketService } from '../services/socketService';
import type { Task } from '../types';
import AddTaskModal from '../components/AddTaskModal';
import WarningModal from '../components/WarningModal';
import LoadingState from '../components/LoadingState';
import RoomHeader from '../components/RoomHeader';
import TaskList from '../components/TaskList';
import ParticipantsList from '../components/ParticipantsList';
import TaskDetails from '../components/TaskDetails';
import { Card, CardContent } from '@/components/ui/card';
import { FileTextIcon } from '@phosphor-icons/react';

export default function RoomPage() {
    const { t } = useTranslation();
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);

    const {
        room,
        currentUser,
        isConnected,
        reset,
    } = useRoomStore();

    const {
        updateTaskDetails,
        setOnEstimate,
        setOnFinalEstimatePreview,
        setOnFinalEstimateChange,
        setOnReveal,
        setOnHide,
        setOnCloseTask,
    } = useTaskDetailsStore();

    const {
        createTask,
        deleteTask,
        selectTask,
        estimateTask,
        revealEstimates,
        hideEstimates,
        resetEstimates,
        previewFinalEstimate,
        setFinalEstimate,
    } = useSocket({
        onError: (err) => {
            console.error('Socket error:', err.message);
        },
    });

    useRoomNavigation(roomCode, room, isConnected);

    const isManager = currentUser?.role === 'manager';
    const managerCanParticipate = isManager && currentUser?.participationMode === 'participant';
    const isParticipant = currentUser?.role === 'participant' || managerCanParticipate;
    const currentTask = room?.tasks.find((t) => t.id === room.currentTaskId) as Task | undefined;

    const {
        currentUserEstimate,
        numericCardSet,
        estimatesForCurrentTask,
        averageEstimate,
        medianEstimate,
        totalParticipants,
        votedParticipants,
    } = useEstimateCalculations(room, currentUser, room?.currentTaskId ?? null);

    const {
        handleEstimate,
        handleFinalEstimatePreview,
        handleFinalEstimateChange,
        handleReveal,
        handleHide,
        handleAddTask,
        handleDeleteTask,
    } = useTaskHandlers({
        room,
        roomCode,
        isManager,
        isParticipant,
        createTask,
        deleteTask,
        estimateTask,
        revealEstimates,
        hideEstimates,
        resetEstimates,
        previewFinalEstimate,
        setFinalEstimate,
        setShowAddTaskModal,
    });

    const {
        handleSelectTask,
        warningModal,
        closeWarningModal,
    } = useTaskSelection({
        room,
        roomCode,
        isManager,
        selectTask,
        setFinalEstimate,
    });

    useAutoFinalEstimate({
        isManager,
        room,
        currentTask,
        roomCode,
        medianEstimate,
        estimatesForCurrentTask,
        setFinalEstimate,
    });

    const handleLeave = () => {
        socketService.disconnect();
        reset();
        navigate('/');
    };

    // Update task details store
    useEffect(() => {
        if (!room || !currentUser) return;
        updateTaskDetails({
            currentTask: currentTask || null,
            isManager,
            isParticipant,
            currentUserEstimate,
            numericCardSet,
            estimatesForCurrentTask,
            averageEstimate,
            medianEstimate,
            votedParticipants,
            totalParticipants,
        });
    }, [
        currentTask,
        isManager,
        isParticipant,
        currentUserEstimate,
        numericCardSet,
        estimatesForCurrentTask,
        averageEstimate,
        medianEstimate,
        votedParticipants,
        totalParticipants,
        updateTaskDetails,
        room,
        currentUser,
    ]);

    const handleCloseTask = useCallback(() => {
        if (!roomCode) return;
        selectTask({ roomCode, taskId: null });
    }, [roomCode, selectTask]);

    // Set handlers
    useEffect(() => {
        setOnEstimate(handleEstimate);
        setOnFinalEstimatePreview(handleFinalEstimatePreview);
        setOnFinalEstimateChange(handleFinalEstimateChange);
        setOnReveal(handleReveal);
        setOnHide(handleHide);
        setOnCloseTask(handleCloseTask);
    }, [handleEstimate, handleFinalEstimatePreview, handleFinalEstimateChange, handleReveal, handleHide, handleCloseTask, setOnEstimate, setOnFinalEstimatePreview, setOnFinalEstimateChange, setOnReveal, setOnHide, setOnCloseTask]);

    if (!room || !currentUser || !roomCode) {
        return <LoadingState />;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <RoomHeader
                    roomName={room.name}
                    roomCode={roomCode!}
                    isManager={isManager}
                    isRevealed={room.isRevealed}
                    hasCurrentTask={!!room.currentTaskId}
                    currentUserName={currentUser.name}
                    currentCardSet={room.cardSet}
                    anonymousVotes={room.anonymousVotes}
                    onLeave={handleLeave}
                    onChangeName={(name) => {
                        if (roomCode) {
                            socketService.changeOwnName({ roomCode, name });
                        }
                    }}
                    onChangeCardSet={(cardSet) => {
                        if (roomCode) {
                            socketService.changeCardSet({ roomCode, cardSet });
                        }
                    }}
                    onChangeAnonymousVotes={(anonymousVotes) => {
                        if (roomCode) {
                            socketService.changeAnonymousVotes({ roomCode, anonymousVotes });
                        }
                    }}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="lg:col-span-1 space-y-6 lg:space-y-8">
                        <TaskList
                            tasks={room.tasks}
                            currentTaskId={room.currentTaskId}
                            isManager={isManager}
                            onSelectTask={handleSelectTask}
                            onDeleteTask={handleDeleteTask}
                            onAddTask={() => setShowAddTaskModal(true)}
                        />

                        <ParticipantsList
                            participants={room.participants}
                            isManager={isManager}
                            roomCode={roomCode}
                            onRemoveParticipant={roomCode ? (participantId) => {
                                socketService.removeParticipant({ roomCode, participantId });
                            } : undefined}
                            onChangeParticipantRole={roomCode ? (participantId, role) => {
                                socketService.changeParticipantRole({ roomCode, participantId, role });
                            } : undefined}
                        />
                    </div>

                    <div className="lg:col-span-2">
                        {currentTask ? (
                            <TaskDetails cardSet={room.cardSet} />
                        ) : (
                            <Card>
                                <CardContent className="text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                                        <FileTextIcon className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-lg font-medium text-foreground">{t('taskList.noTaskSelected')}</p>
                                    <p className="text-sm text-muted-foreground mt-2">{t('taskList.selectTaskToStart')}</p>
                                    {room.tasks.length > 0 && (
                                        <p className="text-sm text-muted-foreground mt-3">
                                            {room.tasks.filter(task => task.finalEstimate !== null).length} / {room.tasks.length} {t('taskList.tasksEstimated')}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <AddTaskModal
                isOpen={showAddTaskModal}
                onClose={() => setShowAddTaskModal(false)}
                onAdd={handleAddTask}
            />

            <WarningModal
                isOpen={warningModal.isOpen}
                onClose={closeWarningModal}
                onConfirm={warningModal.onConfirm}
                title={warningModal.title}
                message={warningModal.message}
                confirmText={t('common.confirm')}
                cancelText={t('common.cancel')}
            />
        </div>
    );
}
