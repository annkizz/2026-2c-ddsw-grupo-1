import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  ThemeProvider,
} from "@mui/material";
import styled from "@emotion/styled";
import {
  cerrarProyecto,
  crearProyecto,
  obtenerColectivos,
  obtenerProyectos,
} from "./services/api";
import theme, { tokens } from "./theme";
import infoIcon from "./assets/project-info.svg";
import searchOpenIcon from "./assets/search-open.svg";
import searchClosedIcon from "./assets/search-closed.svg";
import completeIcon from "./assets/project-complete.svg";

const Page = styled.div`
  min-height: 100vh;
  background: ${tokens.background};
  color: ${tokens.text};
`;

const Header = styled.header`
  min-height: 92px;
  padding: 20px 32px;
  border-bottom: 1px solid ${tokens.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 760px) {
    min-height: 0;
    padding: 16px 20px;
    flex-wrap: wrap;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const BrandMark = styled.span`
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  position: relative;
  border-radius: 4px;
  background: ${tokens.primary};
  color: white;
  font-size: 15px;
  font-weight: 700;

  &::after {
    content: "";
    position: absolute;
    width: 4px;
    height: 4px;
    right: 0;
    bottom: 0;
    background: ${tokens.accent};
  }
`;

const BrandName = styled.span`
  font-family: "Space Grotesk", sans-serif;
  font-size: 20px;
  font-weight: 600;
  white-space: nowrap;
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(16px, 4vw, 56px);

  @media (max-width: 760px) {
    order: 3;
    width: 100%;
    justify-content: flex-start;
    overflow-x: auto;
    gap: 24px;
    padding-bottom: 2px;
  }
`;

const NavigationItem = styled.span`
  color: ${tokens.primary};
  font-size: 14px;
  white-space: nowrap;
  font-weight: ${(props) => (props.$active ? 600 : 500)};
`;

const AccountButton = styled(Button)`
  && {
    min-width: 180px;
    padding: 9px 14px;
    border: 1px solid ${tokens.primary};
    border-radius: 8px;
    color: ${tokens.primary};
    background: ${tokens.surface};
    font-weight: 600;
    text-transform: none;
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    && {
      min-width: 0;
    }
  }
`;

const Main = styled.main`
  width: min(100%, 1440px);
  margin: 0 auto;
  padding: 32px 5vw 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (max-width: 600px) {
    padding: 24px 20px 40px;
    gap: 20px;
  }
`;

const Intro = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 600px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const IntroText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-family: "Space Grotesk", sans-serif;
  font-size: 28px;
  line-height: 1.25;
  font-weight: 700;
  color: ${tokens.text};
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${tokens.secondaryText};
  font-size: 14px;
`;

const PrimaryButton = styled(Button)`
  && {
    min-height: 40px;
    padding: 8px 18px;
    border-radius: 7px;
    background: ${tokens.primary};
    color: ${tokens.surface};
    font-size: 14px;
    font-weight: 600;
    text-transform: none;

    &:hover {
      background: #0e263a;
    }
  }
`;

const Filters = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 20px;
  align-items: end;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const FilterField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: ${tokens.text};
  font-size: 13px;
  font-weight: 500;
`;

const SearchInput = styled(TextField)`
  && {
    .MuiOutlinedInput-root {
      height: 40px;
      border-radius: 7px;
      background: ${tokens.surface};
      font-size: 14px;
    }

    .MuiOutlinedInput-notchedOutline {
      border-color: ${tokens.fieldBorder};
    }
  }
`;

const FilterGroup = styled.fieldset`
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
`;

const FilterLegend = styled.legend`
  margin-bottom: 6px;
  color: ${tokens.text};
  font-size: 13px;
  font-weight: 500;
`;

const FilterOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
`;

const FilterButton = styled(Button)`
  && {
    min-width: 0;
    min-height: 40px;
    padding: 6px;
    border: 1px solid ${tokens.primary};
    border-radius: 7px;
    background: ${(props) =>
      props["data-selected"] === "true" ? tokens.primary : tokens.surface};
    color: ${(props) =>
      props["data-selected"] === "true" ? tokens.surface : tokens.primary};
    font-size: 13px;
    font-weight: 600;
    text-transform: none;
    white-space: nowrap;
  }
`;

const ResultsCount = styled.p`
  margin: 0;
  color: ${tokens.secondaryText};
  font-size: 14px;
`;

const ProjectGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const ProjectCard = styled.article`
  min-width: 0;
  padding: 20px;
  border: 1px solid ${tokens.border};
  border-radius: 10px;
  background: ${tokens.surface};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 3px 8px;
  border-radius: 4px;
  background: ${(props) =>
    props.$finished ? tokens.background : tokens.infoBackground};
  color: ${(props) => (props.$finished ? tokens.success : tokens.primary)};
  font-size: 13px;
  font-weight: 500;
`;

const StatusIcon = styled.img`
  width: 16px;
  height: 16px;
  display: block;
`;

const ProjectTitle = styled.h2`
  width: 100%;
  margin: 0;
  color: ${tokens.text};
  font-family: "Space Grotesk", sans-serif;
  font-size: 18px;
  line-height: 1.35;
  font-weight: 600;
  overflow-wrap: anywhere;
`;

const ProgressSection = styled.div`
  width: 100%;
`;

const ProgressHeading = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  color: ${tokens.secondaryText};
  font-size: 13px;

  span:last-child {
    color: ${tokens.text};
    font-weight: 500;
    white-space: nowrap;
  }
`;

const ProjectProgress = styled(LinearProgress)`
  && {
    height: 6px;
    overflow: hidden;
    border-radius: 4px;
    background: ${tokens.border};

    .MuiLinearProgress-bar {
      border-radius: 4px;
      background: ${tokens.primary};
    }
  }
`;

const ProjectMeta = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: ${tokens.secondaryText};
  font-size: 13px;
  line-height: 1.5;
`;

const MetaLine = styled.div`
  min-height: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Actions = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
`;

const SecondaryButton = styled(Button)`
  && {
    min-width: 64px;
    min-height: 38px;
    padding: 6px 12px;
    border: 1px solid ${tokens.primary};
    border-radius: 7px;
    color: ${tokens.primary};
    font-size: 13px;
    font-weight: 600;
    text-transform: none;
  }
`;

const TextButton = styled(Button)`
  && {
    min-height: 38px;
    padding: 6px 12px;
    color: ${tokens.primary};
    font-size: 13px;
    font-weight: 600;
    text-transform: none;

    &.Mui-disabled {
      color: ${tokens.primary};
      opacity: 1;
    }
  }
`;

const StateMessage = styled.div`
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  color: ${tokens.secondaryText};
`;

const DialogForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
`;

const DialogCopy = styled.p`
  margin: 0;
  color: ${tokens.secondaryText};
  line-height: 1.6;
  white-space: pre-wrap;
`;

const filters = [
  { label: "Todos", value: "TODOS" },
  { label: "Activos", value: "ACTIVO" },
  { label: "Finalizados", value: "FINALIZADO" },
];

const emptyForm = { titulo: "", descripcion: "", idColectivo: "", fechaLimiteCierre: "" };

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getProjectStatus(project) {
  return project.estado === "FINALIZADO" ? "FINALIZADO" : "ACTIVO";
}

function App() {
  const [projects, setProjects] = useState([]);
  const [colectivos, setColectivos] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [projectToClose, setProjectToClose] = useState(null);
  const [closing, setClosing] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    severity: "success",
  });

  const loadData = useCallback(async (signal) => {
    setLoading(true);
    setLoadError("");
    try {
      const [projectData, colectivoData] = await Promise.all([
        obtenerProyectos(signal),
        obtenerColectivos(signal),
      ]);
      setProjects(projectData);
      setColectivos(colectivoData);
    } catch (error) {
      if (error.name !== "CanceledError") {
        setLoadError(
          error.response?.data?.message ||
            "No pudimos cargar los proyectos. Revisá tu conexión e intentá nuevamente.",
        );
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const visibleProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("es");
    return projects.filter((project) => {
      const matchesName = project.titulo
        .toLocaleLowerCase("es")
        .includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "TODOS" || getProjectStatus(project) === statusFilter;
      return matchesName && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const openCreateDialog = () => {
    setForm({
      ...emptyForm,
      idColectivo: colectivos.length === 1 ? colectivos[0].id : "",
    });
    setCreateError("");
    setCreateOpen(true);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const titulo = form.titulo.trim();
    const descripcion = form.descripcion.trim();

    if (!titulo || !descripcion || !form.idColectivo) {
      setCreateError("Completá el título, la descripción y el colectivo.");
      return;
    }

    let fechaLimiteCierre;
    if (form.fechaLimiteCierre) {
      const selectedDate = new Date(`${form.fechaLimiteCierre}T00:00:00`);
      if (Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
        setCreateError("La fecha de cierre debe ser una fecha futura.");
        return;
      }
      fechaLimiteCierre = selectedDate.toISOString();
    }

    setCreating(true);
    setCreateError("");
    try {
      const project = await crearProyecto({
        idColectivo: form.idColectivo,
        titulo,
        descripcion,
        ...(fechaLimiteCierre ? { fechaLimiteCierre } : {}),
      });
      setProjects((current) => [project, ...current]);
      setCreateOpen(false);
      setForm(emptyForm);
      setNotification({
        message: "El proyecto se creó correctamente.",
        severity: "success",
      });
    } catch (error) {
      setCreateError(
        error.response?.data?.message ||
          "No pudimos crear el proyecto. Verificá los datos e intentá nuevamente.",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleCloseProject = async () => {
    if (!projectToClose) return;
    setClosing(true);
    try {
      const updatedProject = await cerrarProyecto(projectToClose.id);
      setProjects((current) =>
        current.map((project) =>
          project.id === updatedProject.id ? updatedProject : project,
        ),
      );
      setProjectToClose(null);
      setNotification({
        message: "El proyecto se cerró correctamente.",
        severity: "success",
      });
    } catch (error) {
      setNotification({
        message:
          error.response?.data?.message ||
          "No pudimos cerrar el proyecto. Intentá nuevamente.",
        severity: "error",
      });
    } finally {
      setClosing(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Page>
        <Header>
          <Brand aria-label="Código a Voluntad">
            <BrandMark aria-hidden="true">&lt;&gt;</BrandMark>
            <BrandName>Código a Voluntad</BrandName>
          </Brand>
          <Navigation aria-label="Navegación principal">
            <NavigationItem $active aria-current="page">
              Mis proyectos
            </NavigationItem>
            <NavigationItem>Postulaciones</NavigationItem>
            <NavigationItem>Buscar colaboradoras</NavigationItem>
            <NavigationItem>Mensajes</NavigationItem>
          </Navigation>
          <AccountButton aria-label="Colectivo activo">Colectivo Sur⌄</AccountButton>
        </Header>

        <Main>
          <Intro>
            <IntroText>
              <PageTitle>Mis proyectos</PageTitle>
              <Subtitle>
                Administrá los proyectos de tu colectivo y mirá cómo avanzan
              </Subtitle>
            </IntroText>
            <PrimaryButton onClick={openCreateDialog}>
              Crear proyecto
            </PrimaryButton>
          </Intro>

          <Filters>
            <FilterField>
              Buscar por título
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Escribí el título del proyecto"
                slotProps={{
                  htmlInput: { "aria-label": "Buscar por título" },
                }}
              />
            </FilterField>
            <FilterGroup>
              <FilterLegend>Estado</FilterLegend>
              <FilterOptions>
                {filters.map((filter) => (
                  <FilterButton
                    key={filter.value}
                    type="button"
                    data-selected={
                      statusFilter === filter.value ? "true" : "false"
                    }
                    aria-pressed={statusFilter === filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    {filter.label}
                  </FilterButton>
                ))}
              </FilterOptions>
            </FilterGroup>
          </Filters>

          <ResultsCount aria-live="polite">
            {visibleProjects.length}{" "}
            {visibleProjects.length === 1 ? "proyecto" : "proyectos"}
          </ResultsCount>

          {loading ? (
            <StateMessage role="status" aria-label="Cargando proyectos">
              <CircularProgress size={32} />
              <span>Cargando proyectos…</span>
            </StateMessage>
          ) : loadError ? (
            <StateMessage>
              <Alert severity="error">{loadError}</Alert>
              <SecondaryButton onClick={() => loadData()}>
                Reintentar
              </SecondaryButton>
            </StateMessage>
          ) : visibleProjects.length === 0 ? (
            <StateMessage>
              No encontramos proyectos que coincidan con tu búsqueda.
            </StateMessage>
          ) : (
            <ProjectGrid aria-label="Lista de proyectos">
              {visibleProjects.map((project) => {
                const isFinished = getProjectStatus(project) === "FINALIZADO";
                const progress = Number(project.porcentajeConcrecion) || 0;
                const deadline = formatDate(project.fechaLimiteCierre);

                return (
                  <ProjectCard key={project.id}>
                    <StatusBadge $finished={isFinished}>
                      <StatusIcon
                        src={isFinished ? completeIcon : infoIcon}
                        alt=""
                        aria-hidden="true"
                      />
                      {isFinished ? "Finalizado" : "Activo"}
                    </StatusBadge>
                    <ProjectTitle>{project.titulo}</ProjectTitle>
                    <ProgressSection>
                      <ProgressHeading>
                        <span>Avance</span>
                        <span>{progress} %</span>
                      </ProgressHeading>
                      <ProjectProgress
                        variant="determinate"
                        value={Math.min(100, Math.max(0, progress))}
                        aria-label={`Avance del proyecto: ${progress}%`}
                      />
                    </ProgressSection>
                    <ProjectMeta>
                      <MetaLine>
                        <StatusIcon
                          src={isFinished ? searchClosedIcon : searchOpenIcon}
                          alt=""
                          aria-hidden="true"
                        />
                        {isFinished ? "Búsqueda cerrada" : "Búsqueda abierta"}
                      </MetaLine>
                      <div>
                        {isFinished
                          ? "Proyecto finalizado"
                          : deadline
                            ? `Cierre programado: ${deadline}`
                            : "Sin cierre programado"}
                      </div>
                    </ProjectMeta>
                    <Actions>
                      <SecondaryButton
                        onClick={() => setSelectedProject(project)}
                        aria-label={`Ver ${project.titulo}`}
                      >
                        Ver
                      </SecondaryButton>
                      <TextButton
                        disabled
                        title="La edición no está disponible en la API actual"
                        aria-label={`Editar ${project.titulo} (no disponible)`}
                      >
                        Editar
                      </TextButton>
                      {!isFinished && (
                        <TextButton
                          onClick={() => setProjectToClose(project)}
                          aria-label={`Cerrar ${project.titulo}`}
                        >
                          Cerrar proyecto
                        </TextButton>
                      )}
                    </Actions>
                  </ProjectCard>
                );
              })}
            </ProjectGrid>
          )}
        </Main>

        <Dialog
          open={createOpen}
          onClose={() => !creating && setCreateOpen(false)}
          fullWidth
          maxWidth="sm"
          aria-labelledby="create-project-title"
        >
          <DialogTitle id="create-project-title">Crear proyecto</DialogTitle>
          <DialogContent>
            <DialogForm onSubmit={handleCreate} noValidate>
              <TextField
                label="Título"
                value={form.titulo}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    titulo: event.target.value,
                  }))
                }
                required
                slotProps={{ htmlInput: { maxLength: 120 } }}
                fullWidth
              />
              <TextField
                label="Descripción"
                value={form.descripcion}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    descripcion: event.target.value,
                  }))
                }
                required
                multiline
                minRows={3}
                fullWidth
              />
              <FormControl fullWidth required>
                <InputLabel id="collective-select-label">Colectivo</InputLabel>
                <Select
                  labelId="collective-select-label"
                  label="Colectivo"
                  value={form.idColectivo}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      idColectivo: event.target.value,
                    }))
                  }
                >
                  {colectivos.map((colectivo) => (
                    <MenuItem key={colectivo.id} value={colectivo.id}>
                      {colectivo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Cierre programado (opcional)"
                type="date"
                value={form.fechaLimiteCierre}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fechaLimiteCierre: event.target.value,
                  }))
                }
                slotProps={{
                  htmlInput: {
                    min: new Date(Date.now() + 24 * 60 * 60 * 1000)
                      .toISOString()
                      .slice(0, 10),
                  },
                  inputLabel: { shrink: true },
                }}
                fullWidth
              />
              {createError && <Alert severity="error">{createError}</Alert>}
              <DialogActions sx={{ px: 0 }}>
                <Button
                  onClick={() => setCreateOpen(false)}
                  disabled={creating}
                  sx={{ color: tokens.primary, textTransform: "none" }}
                >
                  Cancelar
                </Button>
                <PrimaryButton type="submit" disabled={creating}>
                  {creating ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Crear proyecto"
                  )}
                </PrimaryButton>
              </DialogActions>
            </DialogForm>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(projectToClose)}
          onClose={() => !closing && setProjectToClose(null)}
          aria-labelledby="close-project-title"
        >
          <DialogTitle id="close-project-title">¿Cerrar proyecto?</DialogTitle>
          <DialogContent>
            <DialogCopy>
              {projectToClose
                ? `La búsqueda de “${projectToClose.titulo}” se cerrará y el proyecto quedará finalizado.`
                : ""}
            </DialogCopy>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setProjectToClose(null)}
              disabled={closing}
              sx={{ color: tokens.primary, textTransform: "none" }}
            >
              Cancelar
            </Button>
            <PrimaryButton onClick={handleCloseProject} disabled={closing}>
              {closing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Cerrar proyecto"
              )}
            </PrimaryButton>
          </DialogActions>
        </Dialog>

        <Dialog
          open={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          fullWidth
          maxWidth="sm"
          aria-labelledby="project-details-title"
        >
          <DialogTitle id="project-details-title">
            {selectedProject?.titulo}
          </DialogTitle>
          <DialogContent>
            <DialogCopy>{selectedProject?.descripcion}</DialogCopy>
            {selectedProject && (
              <ProjectMeta style={{ marginTop: 16 }}>
                <MetaLine>
                  Avance: {Number(selectedProject.porcentajeConcrecion) || 0} %
                </MetaLine>
                <MetaLine>
                  Perfiles requeridos: {selectedProject.perfiles?.length ?? 0}
                </MetaLine>
                {selectedProject.enlaceSistema && (
                  <a
                    href={selectedProject.enlaceSistema}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver sistema
                  </a>
                )}
                {selectedProject.enlaceCodigoFuente && (
                  <a
                    href={selectedProject.enlaceCodigoFuente}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver código fuente
                  </a>
                )}
              </ProjectMeta>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setSelectedProject(null)}
              sx={{ color: tokens.primary, textTransform: "none" }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={Boolean(notification.message)}
          autoHideDuration={4500}
          onClose={() => setNotification({ message: "", severity: "success" })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setNotification({ message: "", severity: "success" })}
            severity={notification.severity}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Page>
    </ThemeProvider>
  );
}

export default App;
