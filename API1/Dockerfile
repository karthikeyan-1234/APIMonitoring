# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies (caching layer)
COPY ["API1.csproj", "."]
RUN dotnet restore "API1.csproj"

# Copy the remaining source code and build the application
COPY . .
RUN dotnet publish "API1.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Copy the published output from the build stage
COPY --from=build /app/publish .

# Set the entry point
ENTRYPOINT ["dotnet", "API1.dll"]