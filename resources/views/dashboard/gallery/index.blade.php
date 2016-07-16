@extends('layouts.dashboard')

@section('page_title')
    Галереи
@endsection

@section('content_title')
    Список галерей
@endsection()

@section('content')
    <?php $i = ($galleries->currentPage() - 1) * 10 + 1?>
    <table class="table">
        <thead>
            <th>№</th>
            <th>Название</th>
            <th>Название в системе</th>
            <th>Действия с изображениями</th>
            <th>Действия с галлереей</th>
        </thead>
        <tbody>
            @foreach($galleries as $gallery)
                <tr>
                    <td>{{ $i++ }}</td>
                    <td>{{ $gallery->title }}</td>
                    <td>{{ $gallery->name }}</td>
                    <td>
                        <a class="btn btn-default btn-sm" href="{{ route('upload_gallery', $gallery->id) }}">Загрузить</a>
                        <a class="btn btn-default btn-sm" href="{{ route('sorting_image_gallery', $gallery->id) }}">Сортировать</a>
                    </td>
                    <td>
                        <a class="btn btn-default btn-sm" href="{{ route('edit_gallery', $gallery->id) }}">Редактировать</a>
                        <a class="btn btn-danger btn-sm" href="{{ route('delete_gallery', $gallery->id) }}">Удалить</a>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
    {{ $galleries->render() }}
    <br>
    <p><a class="btn btn-primary btn-square" href="{{ route('create_gallery') }}">Создать галлерею</a></p>
@endsection