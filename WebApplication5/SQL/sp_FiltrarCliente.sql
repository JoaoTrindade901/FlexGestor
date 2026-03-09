-- =====================================================================
-- Stored Procedure: sp_FiltrarCliente
-- Descrição: Filtro avançado de clientes com múltiplos parâmetros
--            Todos os parâmetros são opcionais (NULL = ignorar filtro)
-- =====================================================================

CREATE OR ALTER PROCEDURE [dbo].[sp_FiltrarCliente]
    @Nome                   NVARCHAR(200) = NULL,
    @CpfCnpj                NVARCHAR(20)  = NULL,
    @Email                  NVARCHAR(200) = NULL,
    @TipoCliente            INT           = NULL,
    @Genero                 NVARCHAR(10)  = NULL,
    @Estado                 NVARCHAR(2)   = NULL,
    @Cidade                 NVARCHAR(100) = NULL,
    @FAtivo                 BIT           = NULL,
    @DthCadastroInicio      DATETIME      = NULL,
    @DthCadastroFim         DATETIME      = NULL,
    @DthNascimentoInicio    DATETIME      = NULL,
    @DthNascimentoFim       DATETIME      = NULL,
    @SemEmail               BIT           = NULL,
    @AniversariantesDoMes   BIT           = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.idCliente,
        c.idEmpresa,
        c.nome,
        c.nomeFantasia,
        c.razaoSocial,
        c.cpfCNPJ,
        c.email,
        c.telefone,
        c.tipoCliente_id,
        c.observacao,
        c.genero,
        c.enderecoId,
        c.dthCadastro,
        c.dthNascimento,
        c.fAtivo,
        e.tipoEndereco,
        e.logradouro,
        e.numero,
        e.complemento,
        e.bairro,
        e.cidade,
        e.estado,
        e.pais,
        e.cep
    FROM Cliente c
    LEFT JOIN Endereco e ON c.enderecoId = e.idEndereco
    WHERE
        -- Filtro por nome (busca parcial)
        (@Nome IS NULL OR c.nome LIKE '%' + @Nome + '%')

        -- Filtro por CPF/CNPJ (busca parcial, ignora pontuação)
        AND (@CpfCnpj IS NULL OR REPLACE(REPLACE(REPLACE(c.cpfCNPJ, '.', ''), '-', ''), '/', '')
             LIKE '%' + REPLACE(REPLACE(REPLACE(@CpfCnpj, '.', ''), '-', ''), '/', '') + '%')

        -- Filtro por e-mail (busca parcial)
        AND (@Email IS NULL OR c.email LIKE '%' + @Email + '%')

        -- Filtro por tipo de cliente (1=PF, 2=PJ)
        AND (@TipoCliente IS NULL OR c.tipoCliente_id = @TipoCliente)

        -- Filtro por gênero
        AND (@Genero IS NULL OR c.genero = @Genero)

        -- Filtro por estado
        AND (@Estado IS NULL OR e.estado = @Estado)

        -- Filtro por cidade (busca parcial)
        AND (@Cidade IS NULL OR e.cidade LIKE '%' + @Cidade + '%')

        -- Filtro por status ativo/inativo
        AND (@FAtivo IS NULL OR c.fAtivo = @FAtivo)

        -- Filtro por período de cadastro
        AND (@DthCadastroInicio IS NULL OR c.dthCadastro >= @DthCadastroInicio)
        AND (@DthCadastroFim IS NULL OR c.dthCadastro < DATEADD(DAY, 1, @DthCadastroFim))

        -- Filtro por período de nascimento
        AND (@DthNascimentoInicio IS NULL OR c.dthNascimento >= @DthNascimentoInicio)
        AND (@DthNascimentoFim IS NULL OR c.dthNascimento < DATEADD(DAY, 1, @DthNascimentoFim))

        -- Preset: clientes sem e-mail cadastrado
        AND (@SemEmail IS NULL OR (@SemEmail = 1 AND (c.email IS NULL OR LTRIM(RTRIM(c.email)) = '')))

        -- Preset: aniversariantes do mês atual (compara dia e mês, independente do ano)
        AND (@AniversariantesDoMes IS NULL OR
             (@AniversariantesDoMes = 1
              AND c.dthNascimento IS NOT NULL
              AND MONTH(c.dthNascimento) = MONTH(GETDATE())))

    ORDER BY c.nome;
END
