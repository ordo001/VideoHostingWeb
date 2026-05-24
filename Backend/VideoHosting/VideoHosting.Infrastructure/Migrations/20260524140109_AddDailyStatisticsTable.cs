using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VideoHosting.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDailyStatisticsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DailyStatistics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    NewUsers = table.Column<int>(type: "integer", nullable: false),
                    NewVideos = table.Column<int>(type: "integer", nullable: false),
                    NewViews = table.Column<int>(type: "integer", nullable: false),
                    NewLikes = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyStatistics", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DailyStatistics_Date",
                table: "DailyStatistics",
                column: "Date",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DailyStatistics");
        }
    }
}
