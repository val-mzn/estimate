import { useEffect, useState } from 'react';
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
import ErrorAlert from '../components/ErrorAlert';
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
        error,
        reset,
    } = useRoomStore();

    const {
        updateTaskDetails,
        setOnEstimate,
        setOnFinalEstimateChange,
        setOnReveal,
        setOnHide,
    } = useTaskDetailsStore();

    const {
        createTask,
        deleteTask,
        selectTask,
        estimateTask,
        revealEstimates,
        hideEstimates,
        resetEstimates,
        setFinalEstimate,
    } = useSocket({
        onError: (err) => {
            console.error('Socket error:', err.message);
        },
    });

    useRoomNavigation(roomCode, room, isConnected);

    const isCreator = currentUser?.role === 'creator';
    const creatorCanParticipate = isCreator && currentUser?.participationMode === 'participant';
    const isParticipant = currentUser?.role === 'participant' || creatorCanParticipate;
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
        handleFinalEstimateChange,
        handleReveal,
        handleHide,
        handleAddTask,
        handleDeleteTask,
    } = useTaskHandlers({
        room,
        roomCode,
        isCreator,
        isParticipant,
        createTask,
        deleteTask,
        estimateTask,
        revealEstimates,
        hideEstimates,
        resetEstimates,
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
        isCreator,
        selectTask,
        setFinalEstimate,
    });

    useAutoFinalEstimate({
        isCreator,
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
            isCreator,
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
        isCreator,
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

    // Set handlers
    useEffect(() => {
        setOnEstimate(handleEstimate);
        setOnFinalEstimateChange(handleFinalEstimateChange);
        setOnReveal(handleReveal);
        setOnHide(handleHide);
    }, [handleEstimate, handleFinalEstimateChange, handleReveal, handleHide, setOnEstimate, setOnFinalEstimateChange, setOnReveal, setOnHide]);

    if (!room || !currentUser || !roomCode) {
        return <LoadingState />;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                {error && <ErrorAlert message={error} />}

                <RoomHeader
                    roomName={room.name}
                    roomCode={roomCode!}
                    isCreator={isCreator}
                    isRevealed={room.isRevealed}
                    hasCurrentTask={!!room.currentTaskId}
                    onLeave={handleLeave}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="lg:col-span-1 space-y-6 lg:space-y-8">
                        <TaskList
                            tasks={room.tasks}
                            currentTaskId={room.currentTaskId}
                            isCreator={isCreator}
                            onSelectTask={handleSelectTask}
                            onDeleteTask={handleDeleteTask}
                            onAddTask={() => setShowAddTaskModal(true)}
                        />

                        <ParticipantsList
                            participants={room.participants}
                            isCreator={isCreator}
                            onRemoveParticipant={roomCode ? (participantId) => {
                                socketService.removeParticipant({ roomCode, participantId });
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
